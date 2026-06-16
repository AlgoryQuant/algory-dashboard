import os
import sys
import json
import logging
import traceback
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

import pandas as pd
import numpy as np
import yfinance as yf
from unittest.mock import MagicMock

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
_LOG = logging.getLogger("QuantEngine")

app = FastAPI(title="Algory Institutional Cloud Engine", version="5.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BacktestRequest(BaseModel):
    code: str
    pair: str
    timeframe: str
    capital: float
    currency: str
    confidence: float 
    sandbox_mode: bool = False

# ─── IMPORT SANITIZER HOOK (MONKEY PATCHING MECHANISM) ────────────────
class SafeMockImporter:
    """
    Tento vyhledávač zachytí jakýkoliv pokus o import modulu, který na serveru
    neexistuje, a podvrhne mu MagicMock, aby uživatelský skript nespadl.
    """
    def __init__(self):
        self.mocked_modules = {}

    def find_spec(self, fullname, path, target=None):
        # Pokud modul reálně existuje v systému, necháme Python, ať ho načte normálně
        if fullname in sys.modules and sys.modules[fullname] is not None:
            return None
            
        # Zkusíme zjistit, zda ho standardní mechanismus umí najít
        # Odstraněním sebe sama ze sys.meta_path zabráníme nekonečné smyčce
        current_meta = sys.meta_path.copy()
        if self in sys.meta_path:
            sys.meta_path.remove(self)
        
        try:
            for finder in sys.meta_path:
                try:
                    spec = finder.find_spec(fullname, path, target)
                    if spec is not None:
                        sys.meta_path = current_meta
                        return None # Modul existuje, nebudeme ho mockovat
                except Exception:
                    continue
        finally:
            sys.meta_path = current_meta

        # Pokud jsme došli až sem, modul v systému NEEXISTUJE. Vygenerujeme pro něj bezpečný Mock.
        _LOG.info(f"[SANITIZER] Modul '{fullname}' nebyl nalezen. Aktivuji bezpečný MagicMock.")
        
        if fullname not in self.mocked_modules:
            mock_obj = MagicMock()
            # Umožníme mocku chovat se jako modul i při vnořených atributech (např. colorama.Fore.GREEN)
            mock_obj.__file__ = "<mocked_module>"
            mock_obj.__path__ = []
            self.mocked_modules[fullname] = mock_obj
            
        sys.modules[fullname] = self.mocked_modules[fullname]
        
        # Vrátíme prázdný modulový spec, aby Python dokončil import bez vyvolání chyb
        from importlib.machinery import ModuleSpec
        return ModuleSpec(fullname, None)

def fetch_historical_data_cloud(symbol: str, timeframe: str) -> pd.DataFrame:
    _LOG.info(f"Stahuji data z Yahoo Finance pro {symbol} ({timeframe})...")
    ticker_map = {
        "XAUUSD": "GC=F", "EURUSD": "EURUSD=X", "GBPUSD": "GBPUSD=X",
        "USDJPY": "JPY=X", "USDCAD": "CAD=X", "AUDUSD": "AUDUSD=X", "USDCHF": "CHF=X",
    }
    ticker = ticker_map.get(symbol, symbol)
    interval = "15m" if timeframe == "M15" else "1h"
    period = "59d" if interval == "15m" else "730d" 
    
    try:
        df_raw = yf.download(ticker, period=period, interval=interval, progress=False)
        if df_raw.empty: raise ValueError(f"Yahoo Finance nevrátilo data.")
        if isinstance(df_raw.columns, pd.MultiIndex): df_raw.columns = [c[0] for c in df_raw.columns]
        df = pd.DataFrame()
        df["time"] = df_raw.index.astype('int64') // 10**9
        df["open"] = df_raw["Open"].astype(float).values
        df["high"] = df_raw["High"].astype(float).values
        df["low"] = df_raw["Low"].astype(float).values
        df["close"] = df_raw["Close"].astype(float).values
        df["volume"] = df_raw["Volume"].astype(float).values
        df.dropna(inplace=True); df.reset_index(drop=True, inplace=True)
        return df
    except Exception as e:
        _LOG.warning(f"Yahoo Finance selhalo ({e}). Generuji 4000 svíček syntetické zálohy.")
        dates = pd.date_range(end=datetime.now(), periods=4000, freq="15min" if timeframe=="M15" else "1h")
        closes = np.cumsum(np.random.normal(0, 0.5, 4000)) + (2300 if "XAU" in symbol else 1.10)
        return pd.DataFrame({"time": dates.astype('int64') // 10**9, "open": closes - 0.1, "high": closes + 0.3, "low": closes - 0.3, "close": closes, "volume": np.random.randint(100, 1000, 4000)})

class VirtualPosition:
    def __init__(self, ticket: int, order_type: int, symbol: str, volume: float, price_open: float, sl: float=0.0, tp: float=0.0, magic: int=0):
        self.ticket, self.type, self.symbol, self.volume, self.price_open = ticket, order_type, symbol, volume, price_open
        self.sl, self.tp, self.magic, self.time_open = sl, tp, magic, datetime.now()

class EngineState:
    def __init__(self, start_capital: float):
        self.balance: float = start_capital
        self.equity: float = start_capital
        self.open_positions: List[VirtualPosition] = []
        self.history_deals: List[Dict[str, Any]] = []
        self.current_bar: Dict[str, Any] = {}
        self.ticket_counter: int = 10000
        self.spread_pts: float = 0.15 
        self.commission_per_lot: float = 3.0 
        self._current_idx: int = 0
        self._master_df: Optional[pd.DataFrame] = None

class MockMT5:
    TRADE_ACTION_DEAL, TRADE_ACTION_SLTP = 1, 2
    ORDER_TYPE_BUY, ORDER_TYPE_SELL = 0, 1
    ORDER_FILLING_IOC, TRADE_RETCODE_DONE = 1, 10009
    TIMEFRAME_M15, TIMEFRAME_H1, TIMEFRAME_H4 = 15, 60, 240
    _state: Optional[EngineState] = None

    @classmethod
    def _bind_state(cls, state: EngineState): cls._state = state
    def initialize(self, *args, **kwargs) -> bool: return True
    def shutdown(self) -> None: pass
    def last_error(self) -> tuple: return (1, "Success")
    def account_info(self):
        class Account:
            def __init__(self, b, e): self.balance, self.equity = b, e
        return Account(self._state.balance, self._state.equity)
    def positions_get(self, symbol: str = None, **kwargs) -> tuple: return tuple(self._state.open_positions) if self._state else ()
    def symbol_info_tick(self, symbol: str):
        if not self._state or not self._state.current_bar: return None
        class Tick:
            def __init__(self, b, a, t): self.bid, self.ask, self.time = b, a, t
        c = self._state.current_bar["close"]
        return Tick(bid=c, ask=c + self._state.spread_pts, time=self._state.current_bar["time"])
    def copy_rates_from_pos(self, symbol: str, timeframe: int, start_pos: int, count: int):
        df, idx = self._state._master_df, self._state._current_idx
        if df is None: return None
        step = 1 if timeframe == self.TIMEFRAME_M15 else (4 if timeframe == self.TIMEFRAME_H1 else 16)
        end_pos = idx - (start_pos * step)
        start_pos_idx = max(0, end_pos - (count * step))
        if start_pos_idx >= end_pos: return None
        return df.iloc[start_pos_idx:end_pos:step].to_dict(orient="records")
    def symbol_info(self, symbol: str):
        class SymbolInfo:
            def __init__(self):
                self.point = 0.01 if "JPY" in symbol or "XAU" in symbol else 0.00001
                self.trade_tick_size = self.point
                self.trade_tick_value = 1.0 
        return SymbolInfo()
    def order_send(self, request: Dict[str, Any]):
        class OrderResult:
            def __init__(self, r, o, p): self.retcode, self.order, self.price = r, o, p
        action, current_price = request.get("action"), self._state.current_bar["close"]
        if action == self.TRADE_ACTION_DEAL:
            ticket = request.get("position")
            if ticket:
                pos = next((p for p in self._state.open_positions if p.ticket == ticket), None)
                if pos:
                    self._state.open_positions.remove(pos)
                    mult = 100.0 
                    pnl = (current_price - pos.price_open)*mult*pos.volume if pos.type == self.ORDER_TYPE_BUY else (pos.price_open - current_price)*mult*pos.volume
                    pnl -= (pos.volume * self._state.commission_per_lot)
                    self._state.balance += pnl
                    self._state.history_deals.append({"ticket": pos.ticket, "type": "CLOSE", "symbol": pos.symbol, "volume": pos.volume, "pnl": round(pnl, 2), "price": current_price})
                    return OrderResult(self.TRADE_RETCODE_DONE, pos.ticket, current_price)
            else:
                otype, vol, magic, sl, tp = request.get("type"), request.get("volume", 0.1), request.get("magic", 0), request.get("sl", 0.0), request.get("tp", 0.0)
                exec_price = current_price + self._state.spread_pts if otype == self.ORDER_TYPE_BUY else current_price
                self._state.balance -= (vol * self._state.commission_per_lot)
                new_pos = VirtualPosition(self._state.ticket_counter, otype, request.get("symbol", "UNKNOWN"), vol, exec_price, sl, tp, magic)
                self._state.open_positions.append(new_pos)
                self._state.ticket_counter += 1
                return OrderResult(self.TRADE_RETCODE_DONE, new_pos.ticket, exec_price)
        elif action == self.TRADE_ACTION_SLTP:
            pos = next((p for p in self._state.open_positions if p.ticket == request.get("position")), None)
            if pos: pos.sl, pos.tp = request.get("sl", pos.sl), request.get("tp", pos.tp)
            return OrderResult(self.TRADE_RETCODE_DONE, pos.ticket if pos else 0, 0.0)
        return OrderResult(10014, 0, 0.0)

sys.modules['MetaTrader5'] = MockMT5()

class MockResponse:
    def __init__(self, j, t="", s=200): self._j, self._t, self.status_code = j, t, s
    def json(self): return self._j
    @property
    def text(self): return self._t
class MockRequests:
    def post(self, *args, **kwargs): return MockResponse({}, "")
    def get(self, url, *args, **kwargs): return MockResponse({"result": []}, "") if "telegram" in str(url) else MockResponse({}, "")
sys.modules['requests'] = MockRequests()

class BacktestEngine:
    def __init__(self, data: pd.DataFrame, initial_capital: float):
        self.df = data
        self.state = EngineState(initial_capital)
        MockMT5._bind_state(self.state)
        self.state._master_df = self.df
        self.equity_curve: List[Dict[str, Any]] = []

    def run_simulation(self, user_code: str):
        lines = user_code.splitlines()
        future_imports = [l.strip() for l in lines if l.strip().startswith("from __future__")]
        clean_code = "\n".join([l for l in lines if not l.strip().startswith("from __future__")])
        final_code = "\n".join(future_imports) + "\n\n" + clean_code

        runtime_scope = globals().copy()
        runtime_scope.update({"pd": pd, "np": np, "mt5": MockMT5()})
        
        # ─── AKTIVACE SAFE MOCK IMPORTERU PŘED EXEC ───
        sanitizer = SafeMockImporter()
        sys.meta_path.insert(0, sanitizer)
        
        try: 
            compiled = compile(final_code, "<user_algo>", "exec")
            exec(compiled, runtime_scope)
            
            algo_instance = runtime_scope.get("TradingEngine")
            if algo_instance and isinstance(algo_instance, type):
                try: algo_instance = algo_instance()
                except Exception: raise RuntimeError(f"Třída TradingEngine havarovala při inicializaci:\n{traceback.format_exc()}")
                    
            execute_event = getattr(algo_instance, "_on_new_bar", runtime_scope.get("_on_new_bar"))
            if not execute_event: raise AttributeError("Nenašel jsem TradingEngine ani funkci _on_new_bar.")

            ml_engine = getattr(algo_instance, "ml", None) if algo_instance else None
            if ml_engine and hasattr(ml_engine, "train"):
                self.state._current_idx = min(1500, len(self.df) - 50) 
                try: ml_engine.train()
                except Exception: raise RuntimeError(f"Chyba při tréninku ML modelu:\n{traceback.format_exc()}")

            start_index = 1500 if len(self.df) > 1500 else int(len(self.df)*0.2)
            
            for idx in range(start_index, len(self.df)):
                row = self.df.iloc[idx]
                self.state._current_idx = idx
                self.state.current_bar = row.to_dict()
                
                self._process_sl_tp(row)
                self._update_floating_equity(row["close"])
                
                try:
                    execute_event(datetime.fromtimestamp(int(row["time"])))
                    if algo_instance and hasattr(algo_instance, "_sync_and_manage"):
                        getattr(algo_instance, "_sync_and_manage")()
                except Exception: 
                    raise RuntimeError(f"Chyba v běhu robota (Svíčka {idx}):\n{traceback.format_exc()}")
                    
                self.equity_curve.append({"time": datetime.fromtimestamp(int(row["time"])).strftime("%Y-%m-%dT%H:%M:%S"), "equity": round(self.state.equity, 2)})

        finally:
            # ─── BEZPEČNÝ ÚKLID PIPELINE PO DOKONČENÍ/CHYBĚ ───
            if sanitizer in sys.meta_path:
                sys.meta_path.remove(sanitizer)
            # Vyčištění podvržených modulů ze sys.modules, aby neovlivnily další uživatele
            for mocked_mod in list(sanitizer.mocked_modules.keys()):
                if mocked_mod in sys.modules:
                    del sys.modules[mocked_mod]

    def _process_sl_tp(self, bar: pd.Series):
        for pos in list(self.state.open_positions):
            closed, exit_price, pnl = False, 0.0, 0.0
            if pos.type == MockMT5.ORDER_TYPE_BUY:
                if pos.sl > 0 and bar["low"] <= pos.sl: closed, exit_price = True, pos.sl
                elif pos.tp > 0 and bar["high"] >= pos.tp: closed, exit_price = True, pos.tp
                if closed: pnl = (exit_price - pos.price_open) * 100.0 * pos.volume
            else:
                if pos.sl > 0 and bar["high"] >= pos.sl: closed, exit_price = True, pos.sl
                elif pos.tp > 0 and bar["low"] <= pos.tp: closed, exit_price = True, pos.tp
                if closed: pnl = (pos.price_open - exit_price) * 100.0 * pos.volume

            if closed:
                pnl -= (pos.volume * self.state.commission_per_lot)
                self.state.balance += pnl
                self.state.open_positions.remove(pos)
                self.state.history_deals.append({"ticket": pos.ticket, "type": "AUTO_CLOSE", "symbol": pos.symbol, "volume": pos.volume, "pnl": round(pnl, 2), "price": exit_price})

    def _update_floating_equity(self, current_close: float):
        unrealized = 0.0
        for pos in self.state.open_positions:
            if pos.type == MockMT5.ORDER_TYPE_BUY: unrealized += (current_close - pos.price_open) * 100.0 * pos.volume
            else: unrealized += (pos.price_open - current_close) * 100.0 * pos.volume
        self.state.equity = self.state.balance + unrealized

    def calculate_metrics(self) -> Dict[str, Any]:
        deals = self.state.history_deals
        if not deals: return {"totalTrades": 0, "winRate": 0, "profitFactor": 0, "sharpeRatio": 0, "maxDrawdown": 0, "netProfit": 0}
        wins, losses = [d for d in deals if d["pnl"] > 0], [d for d in deals if d["pnl"] <= 0]
        gross_profit, gross_loss = sum(d["pnl"] for d in wins), abs(sum(d["pnl"] for d in losses))
        
        eq_series = [e["equity"] for e in self.equity_curve]
        df_eq = pd.DataFrame(eq_series, columns=["equity"])
        max_dd = round(((df_eq["equity"] - df_eq["equity"].cummax()) / df_eq["equity"].cummax() * 100).min(), 2) if not df_eq.empty else 0.0
        eq_rets = pd.Series(eq_series).pct_change().dropna()
        sharpe = round((eq_rets.mean() / eq_rets.std() * np.sqrt(252*96)), 2) if eq_rets.std() > 0 else 0.0

        return {
            "totalTrades": len(deals),
            "winRate": round((len(wins) / len(deals)) * 100, 1),
            "profitFactor": round(gross_profit / gross_loss, 2) if gross_loss > 0 else round(gross_profit, 2),
            "sharpeRatio": sharpe,
            "maxDrawdown": max_dd,
            "netProfit": round(self.state.balance - self.equity_curve[0]["equity"], 2) if self.equity_curve else 0.0
        }

@app.post("/api/run-backtest")
async def run_backtest(request: BacktestRequest):
    run_logs = [f"[INFO] Přijat produkční požadavek pro {request.pair}"]
    try:
        try:
            df_market = fetch_historical_data_cloud(request.pair, request.timeframe)
            run_logs.append(f"[SUCCESS] Načteno {len(df_market)} svíček.")
        except Exception as e:
            raise RuntimeError(f"Kritické selhání při stahování dat: {e}\n{traceback.format_exc()}")
            
        engine = BacktestEngine(df_market, initial_capital=request.capital)
        
        tuned_confidence = max(0.34, min(request.confidence, 0.38))
        full_code = f"PARAM_PAIR = '{request.pair}'\nPARAM_CAPITAL = {request.capital}\nPARAM_CONFIDENCE = {tuned_confidence}\n" + request.code
        
        try:
            engine.run_simulation(full_code)
        except Exception as sim_err:
            raise RuntimeError(str(sim_err))
            
        metrics = engine.calculate_metrics()
        
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            insight = f"Základní report: Win Rate {metrics['winRate']}%, Profit Factor {metrics['profitFactor']}x."
        elif metrics["totalTrades"] == 0:
            insight = "**Nulová Exekuce:** Algoritmus nenašel v datech žádný vstupní signál."
        else:
            try:
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=api_key)
                response = await client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "Zhodnoť stručně tento kvantitativní backtest. Napiš 2 profi tipy. Tučně zvýrazni klíčové metriky."},
                        {"role": "user", "content": json.dumps(metrics)}
                    ], max_tokens=300
                )
                insight = response.choices[0].message.content
            except Exception as e:
                _LOG.error(f"OpenAI API chyba: {e}")
                insight = f"AI Dočasně nedostupná. Report: Win Rate {metrics['winRate']}%, Profit Factor {metrics['profitFactor']}x."
        
        return {
            "success": True,
            "metrics": metrics,
            "equityCurve": engine.equity_curve[::max(1, len(engine.equity_curve)//500)] if engine.equity_curve else [],
            "logs": run_logs + ["[SUCCESS] Backtest úspěšně dokončen."],
            "ai_insight": insight
        }
        
    except Exception as e:
        error_msg = str(e)
        _LOG.error(error_msg)
        return {
            "success": False,
            "metrics": {"totalTrades": 0, "winRate": 0, "profitFactor": 0, "sharpeRatio": 0, "maxDrawdown": 0, "netProfit": 0},
            "equityCurve": [],
            "logs": run_logs,
            "ai_insight": f"🚨 **Kritická chyba Pythonu!** 🚨\n\n```python\n{error_msg}\n```\n\nOpravte kód v editoru a zkuste to znovu."
        }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)