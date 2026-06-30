"use client";

export class SoundEngine {
  private static ctx: AudioContext | null = null;

  /**
   * Zajišťuje Singleton instanci AudioContextu a řeší Next.js SSR kompatibilitu.
   * Automaticky oživuje kontext, pokud jej prohlížeč zablokoval kvůli Autoplay policy.
   */
  private static getContext(): AudioContext | null {
    // SSR Shield: Zabránění pádu na serveru během build/render fáze
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      
      // Prohlížeče blokují audio dokud uživatel neinteraguje s DOM.
      // Pokud je stav suspended, pokusíme se jej při interakci probudit.
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      
      return this.ctx;
    } catch (e) {
      console.error("AudioContext initialization failed:", e);
      return null;
    }
  }

  /**
   * UI Audio Cues: Tiché technické klapnutí při změně měnového páru.
   * Využívá frekvenční sweep pro perkusivní charakter.
   */
  public static playClick(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      
      // Rychlý pokles frekvence simuluje mechanické kliknutí
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

      // ADSR Obálka: Rychlý náběh (Attack) a okamžitý útlum (Release)
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      console.error("Audio click synthesis error:", e);
    }
  }

  /**
   * Backend Audio Cues: Notifikační pípnutí pro Whale Alert / Spatial Arbitráž.
   * Syntetický akord (A5 + C#6) zaručuje institucionální charakter zvuku.
   */
  public static playAlert(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      // Frekvenční matice dle původního návrhu z image_8da15e.png
      osc1.frequency.setValueAtTime(880, ctx.currentTime);       // A5
      osc2.frequency.setValueAtTime(1108.73, ctx.currentTime);   // C#6

      // ADSR Obálka: Ostrý Attack s dlouhým exponenciálním dozvukem
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      
      // Úklid paměti po dokončení dozvuku
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.error("Audio alert synthesis error:", e);
    }
  }
}