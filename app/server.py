import os
import json
import subprocess
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Inicializace FastAPI aplikace
app = FastAPI(title="Algory Quant Engine API", version="1.0.0")

# ==========================================
# 1. CORS NASTAVENÍ
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 2. DATOVÝ MODEL PRO REQUEST
# ==========================================
class BacktestRequest(BaseModel):
    code: str
    pair: str
    timeframe: str
    capital: float
    currency: str

# ==========================================
# 3. HLAVNÍ ENDPOINT PRO BACKTEST (SUBPROCESS)
# ==========================================
@app.post("/api/run-backtest")
async def run_backtest(request: BacktestRequest):
    logs = [f"[INFO] Přijat požadavek na backtest pro {request.pair} ({request.timeframe})"]
    results_file = "results.json"
    temp_script = "temp_algo.py"
    
    try:
        # 1. Úklid starých souborů z předchozích běhů
        if os.path.exists(results_file): os.remove(results_file)
        if os.path.exists(temp_script): os.remove(temp_script)

        # 2. Injekce parametrů z UI do Python kódu
        injected_parameters = f"""
# --- SYSTÉMOVÉ PARAMETRY INJEKTOVANÉ Z UI ---
PARAM_PAIR = "{request.pair}"
PARAM_TIMEFRAME = "{request.timeframe}"
PARAM_CAPITAL = {request.capital}
PARAM_CURRENCY = "{request.currency}"
# --------------------------------------------

"""
        # Spojíme parametry a uživatelský kód z webu
        final_code = injected_parameters + request.code
        
        # Uložení kódu do dočasného souboru
        with open(temp_script, "w", encoding="utf-8") as f:
            f.write(final_code)
            
        logs.append("[INFO] Spouštím strategii v izolovaném procesu (Subprocess)...")

        # 3. Spuštění nezávislého procesu (Bezpečné proti pádu FastAPI)
        process_result = subprocess.run(
            ["python", temp_script], 
            capture_output=True, 
            text=True
        )

        # 4. Kontrola pádů v samotném skriptu (Syntax error atd.)
        if process_result.returncode != 0:
            error_output = process_result.stderr or process_result.stdout
            raise Exception(f"Skript havaroval během běhu:\n{error_output}")

        # 5. Kontrola vytvoření results.json
        if not os.path.exists(results_file):
            raise FileNotFoundError("Skript úspěšně proběhl, ale neuložil výsledky do 'results.json'.")
            
        logs.append("[INFO] Skript doběhl. Načítám data z results.json...")
        
        # 6. Přečtení vygenerovaných dat a úklid souborů
        with open(results_file, "r", encoding="utf-8") as f:
            backend_data = json.load(f)
            
        os.remove(results_file)
        os.remove(temp_script)
        
        # 7. Sloučení logů (zachytíme i případné printy ze skriptu)
        merged_logs = logs
        if process_result.stdout:
            merged_logs.append(f"[STDOUT] {process_result.stdout.strip()}")
            
        if "logs" in backend_data:
            backend_data["logs"] = merged_logs + backend_data["logs"]
        else:
            backend_data["logs"] = merged_logs
            
        return backend_data

    except Exception as e:
        logs.append(f"[ERROR] Selhání exekuce: {str(e)}")
        # Bezpečnostní úklid při chybě
        if os.path.exists(results_file): os.remove(results_file)
        if os.path.exists(temp_script): os.remove(temp_script)
        
        raise HTTPException(status_code=500, detail={"error": str(e), "logs": logs})

if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)