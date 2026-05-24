import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, nickname } = await request.json();

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

    const data = await resend.emails.send({
      from: 'Algory Engine <onboarding@resend.dev>', 
      to: email,
      subject: 'Access Granted: Algory Quantitative Terminal',
      html: htmlContent,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error });
  }
}