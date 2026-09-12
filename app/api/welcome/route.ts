import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// INITIALIZATION
const resend = new Resend(process.env.RESEND_API_KEY || 'chybejici_klic');

// CACHE CONTROL
export const revalidate = 60;

// ==========================================
// [GET] MARKET DATA TELEMETRY PIPELINE
// ==========================================
export async function GET() {
  try {
    const symbols = ['NEE', 'TGT', 'PFE', 'SYM', 'NVO', 'CZK=X'];
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Exchange HTTP Error: ${response.status}`);
    }

    const json = await response.json();
    const results = json?.quoteResponse?.result;

    if (!results || !Array.isArray(results)) {
      throw new Error("Invalid payload structure from exchange.");
    }
    
    const data = results.reduce((acc: Record<string, any>, quote: any) => {
      if (quote && quote.symbol) {
        acc[quote.symbol] = {
          price: quote.regularMarketPrice || 0,
          prevClose: quote.regularMarketPreviousClose || 0,
          changePercent: quote.regularMarketChangePercent || 0
        };
      }
      return acc;
    }, {} as Record<string, any>);

    if (!data['CZK=X']) {
      throw new Error("Currency conversion matrix failed.");
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API ERROR] Market Data Sync Failed:', error);
    return NextResponse.json({ error: 'Failed to fetch live market parameters.' }, { status: 500 });
  }
}

// ==========================================
// [POST] SYSTEM ACCESS PROVISIONING (RESEND)
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, nickname } = body;

    const htmlContent = `
      <div style="background-color: #050505; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 60px 20px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: -1px; margin-bottom: 5px;">Algory<span style="color: #10b981;">.</span></h1>
        <p style="color: #a1a1aa; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 40px;">System Access Granted</p>
        
        <div style="max-width: 500px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #27272a; border-radius: 16px; padding: 40px; text-align: left;">
          <p style="color: #e4e4e7; font-size: 18px; margin-bottom: 20px;">Welcome to the Engine, <strong style="color: #10b981;">${nickname}</strong>.</p>
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.8; margin-bottom: 30px;">
            Your secure access to the Algory Quantitative Terminal has been successfully provisioned. The AI models are currently analyzing M15 structures, reading live market sentiment, and awaiting catalysts.
          </p>
          <a href="https://algory-dashboard.vercel.app" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: #000000; text-decoration: none; font-weight: bold; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; border-radius: 8px;">Access Terminal</a>
        </div>
        
        <p style="color: #52525b; font-size: 10px; margin-top: 40px; text-transform: uppercase; letter-spacing: 1.5px;">Powered by XGBoost Machine Learning</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Algory Engine <onboarding@resend.dev>', 
      to: email,
      subject: 'Access Granted: Algory Quantitative Terminal',
      html: htmlContent,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}