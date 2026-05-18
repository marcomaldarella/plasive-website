import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Plasive Technologies',
};

export default function PrivacyPage() {
  return (
    <>
      <style>{`
        :root{--bg:#08080c;--text:#eaf4ff;--text-m:#7aabcc;--text-xs:#3a6480;--border:rgba(80,140,200,0.13);--accent:#3080ff;--glass-bg:rgba(8,14,24,0.62);--blur:blur(18px) saturate(1.5);--font:'Outfit',sans-serif;}
        *{margin:0;padding:0;box-sizing:border-box;}
        html{scroll-behavior:smooth;}
        body{background:var(--bg);color:var(--text);font-family:var(--font);min-height:100vh;}
        body::before{content:'';position:fixed;top:-180px;right:-130px;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle,rgba(48,128,255,0.10) 0%,transparent 68%);filter:blur(60px);pointer-events:none;z-index:0;}
        .pp-header{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:18px 6vw;background:rgba(8,8,12,0.80);backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);border-bottom:1px solid var(--border);}
        .logo{font-size:11.5px;font-weight:500;letter-spacing:0.26em;color:var(--text);text-transform:uppercase;text-decoration:none;}
        .pp-back{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:400;color:var(--text-m);text-decoration:none;padding:6px 14px;border:1px solid var(--border);border-radius:8px;background:var(--glass-bg);backdrop-filter:var(--blur);transition:color 0.2s,border-color 0.2s;}
        .pp-back:hover{color:var(--text);border-color:rgba(80,140,200,0.30);}
        .pp-wrap{position:relative;z-index:1;max-width:720px;margin:0 auto;padding:64px 6vw 96px;}
        .pp-eyebrow{font-size:10px;font-weight:500;color:var(--accent);letter-spacing:0.18em;text-transform:uppercase;margin-bottom:18px;display:block;}
        .pp-title{font-size:clamp(28px,5vw,52px);font-weight:300;color:var(--text);line-height:1.10;letter-spacing:-0.016em;margin-bottom:12px;}
        .pp-date{font-size:11px;font-weight:300;color:var(--text-xs);margin-bottom:56px;letter-spacing:0.04em;}
        .pp-toc{background:var(--glass-bg);backdrop-filter:var(--blur);border:1px solid var(--border);border-radius:12px;padding:22px 26px;margin-bottom:52px;}
        .pp-toc-title{font-size:10px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-xs);margin-bottom:14px;}
        .pp-toc ol{list-style:none;counter-reset:toc;display:flex;flex-direction:column;gap:6px;}
        .pp-toc li{counter-increment:toc;}
        .pp-toc a{font-size:12.5px;font-weight:300;color:var(--text-m);text-decoration:none;display:flex;align-items:baseline;gap:10px;transition:color 0.2s;}
        .pp-toc a::before{content:counter(toc,decimal-leading-zero);font-size:9px;font-weight:500;color:var(--text-xs);letter-spacing:0.06em;flex-shrink:0;}
        .pp-toc a:hover{color:var(--text);}
        .pp-section{margin-bottom:48px;padding-top:12px;}
        .pp-section-num{font-size:9px;font-weight:500;color:var(--accent);letter-spacing:0.16em;text-transform:uppercase;margin-bottom:10px;display:block;}
        .pp-section h2{font-size:clamp(16px,2.4vw,22px);font-weight:400;color:var(--text);letter-spacing:-0.005em;line-height:1.25;margin-bottom:18px;}
        .pp-section p,.pp-section li{font-size:13px;font-weight:300;color:var(--text-m);line-height:1.78;}
        .pp-section p+p{margin-top:12px;}
        .pp-section ul,.pp-section ol{padding-left:0;list-style:none;display:flex;flex-direction:column;gap:8px;margin-top:12px;}
        .pp-section ul li{padding-left:20px;position:relative;}
        .pp-section ul li::before{content:'';position:absolute;left:0;top:10px;width:8px;height:1px;background:var(--accent);opacity:0.5;}
        .pp-divider{height:1px;background:var(--border);margin:40px 0;}
        .pp-infobox{background:var(--glass-bg);backdrop-filter:var(--blur);border:1px solid var(--border);border-radius:10px;padding:18px 22px;margin-top:18px;}
        .pp-infobox p{font-size:12px;}
        .pp-infobox strong{font-weight:500;color:var(--text);}
        .pp-footer{border-top:1px solid var(--border);margin-top:64px;padding:28px 6vw;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
        .pp-footer-text{font-size:11px;font-weight:300;color:var(--text-xs);}
        .pp-footer a{font-size:11px;font-weight:400;color:var(--accent);text-decoration:none;}
        @media(max-width:600px){.pp-wrap{padding:40px 5vw 72px;}.pp-toc{padding:16px 18px;}}
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500&display=swap" rel="stylesheet" />

      <header className="pp-header">
        <Link href="/" className="logo">PLASIVE</Link>
        <Link href="/" className="pp-back">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Torna al sito
        </Link>
      </header>

      <main className="pp-wrap">
        <span className="pp-eyebrow">Legal</span>
        <h1 className="pp-title">Privacy Policy</h1>
        <p className="pp-date">Ultimo aggiornamento: 14 maggio 2026</p>

        <nav className="pp-toc" aria-label="Indice">
          <p className="pp-toc-title">Indice</p>
          <ol>
            <li><a href="#titolare">Titolare del Trattamento</a></li>
            <li><a href="#dati">Dati Raccolti</a></li>
            <li><a href="#finalita">Finalità e Base Giuridica</a></li>
            <li><a href="#modalita">Modalità di Trattamento</a></li>
            <li><a href="#conservazione">Periodo di Conservazione</a></li>
            <li><a href="#destinatari">Destinatari dei Dati</a></li>
            <li><a href="#diritti">Diritti dell&apos;Interessato</a></li>
            <li><a href="#cookie">Cookie Policy</a></li>
            <li><a href="#contatti">Contatti</a></li>
          </ol>
        </nav>

        <section className="pp-section" id="titolare">
          <span className="pp-section-num">01 — Titolare</span>
          <h2>Titolare del Trattamento</h2>
          <p>Il Titolare del trattamento dei dati personali raccolti tramite il sito <strong>plasive.tech</strong> è:</p>
          <div className="pp-infobox">
            <p><strong>Plasive Technologies S.r.l.</strong><br/>Via Cesare Battisti 26, 40123 Bologna (BO), Italia<br/>Codice Fiscale e P.IVA: 03736701206<br/>Email: <a href="mailto:info@plasive.tech" style={{color:'var(--accent)',textDecoration:'none'}}>info@plasive.tech</a></p>
          </div>
        </section>

        <div className="pp-divider"/>

        <section className="pp-section" id="dati">
          <span className="pp-section-num">02 — Dati</span>
          <h2>Dati Raccolti</h2>
          <p>Durante la navigazione sul sito e l&apos;utilizzo dei nostri servizi, possono essere raccolte le seguenti categorie di dati:</p>
          <ul>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>Dati di navigazione</strong> — indirizzo IP, tipo di browser, sistema operativo, pagine visitate, orari di accesso.</li>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>Dati forniti volontariamente</strong> — nome, cognome, indirizzo email, numero di telefono e qualsiasi altra informazione trasmessa tramite il modulo di contatto o via email a info@plasive.tech.</li>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>Dati tecnici</strong> — cookie tecnici essenziali (vedere sezione Cookie Policy).</li>
          </ul>
          <p>Non raccogliamo dati personali di categorie particolari (art. 9 GDPR), né dati relativi a condanne penali.</p>
        </section>

        <div className="pp-divider"/>

        <section className="pp-section" id="finalita">
          <span className="pp-section-num">03 — Finalità</span>
          <h2>Finalità e Base Giuridica</h2>
          <ul>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>Gestione delle richieste di contatto</strong> — risposta alle comunicazioni. Base giuridica: art. 6, par. 1, lett. b GDPR.</li>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>Funzionamento tecnico del sito</strong> — log di sistema, sicurezza. Base giuridica: art. 6, par. 1, lett. f GDPR.</li>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>Adempimento di obblighi legali</strong> — normative fiscali e legali. Base giuridica: art. 6, par. 1, lett. c GDPR.</li>
          </ul>
        </section>

        <div className="pp-divider"/>

        <section className="pp-section" id="modalita">
          <span className="pp-section-num">04 — Modalità</span>
          <h2>Modalità di Trattamento</h2>
          <p>Il trattamento avviene mediante strumenti informatici e telematici. I dati sono trattati esclusivamente da personale autorizzato e da eventuali responsabili designati ai sensi dell&apos;art. 28 GDPR. Adottiamo misure tecniche e organizzative adeguate per garantire sicurezza, integrità e riservatezza.</p>
        </section>

        <div className="pp-divider"/>

        <section className="pp-section" id="conservazione">
          <span className="pp-section-num">05 — Conservazione</span>
          <h2>Periodo di Conservazione</h2>
          <ul>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>Dati di contatto</strong> — fino a 24 mesi dal termine della relazione precontrattuale o contrattuale.</li>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>Dati di navigazione</strong> — non oltre 30 giorni.</li>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>Dati fiscali e contabili</strong> — 10 anni, come previsto dalla normativa italiana.</li>
          </ul>
        </section>

        <div className="pp-divider"/>

        <section className="pp-section" id="destinatari">
          <span className="pp-section-num">06 — Destinatari</span>
          <h2>Destinatari dei Dati</h2>
          <p>I dati personali non sono ceduti a terzi per finalità di marketing. Possono essere comunicati a fornitori tecnici nominati responsabili ex art. 28 GDPR, consulenti legali e fiscali, e autorità pubbliche nei casi previsti dalla legge. Non trasferiamo dati a paesi terzi privi di adeguate garanzie.</p>
        </section>

        <div className="pp-divider"/>

        <section className="pp-section" id="diritti">
          <span className="pp-section-num">07 — Diritti</span>
          <h2>Diritti dell&apos;Interessato</h2>
          <ul>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>Accesso</strong> — art. 15 GDPR</li>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>Rettifica</strong> — art. 16 GDPR</li>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>Cancellazione</strong> — art. 17 GDPR</li>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>Limitazione</strong> — art. 18 GDPR</li>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>Portabilità</strong> — art. 20 GDPR</li>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>Opposizione</strong> — art. 21 GDPR</li>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>Reclamo</strong> — <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener" style={{color:'var(--accent)',textDecoration:'none'}}>www.garanteprivacy.it</a></li>
          </ul>
          <p>Per esercitare i tuoi diritti: <a href="mailto:info@plasive.tech" style={{color:'var(--accent)',textDecoration:'none'}}>info@plasive.tech</a>. Risponderemo entro 30 giorni.</p>
        </section>

        <div className="pp-divider"/>

        <section className="pp-section" id="cookie">
          <span className="pp-section-num">08 — Cookie</span>
          <h2>Cookie Policy</h2>
          <p>Il sito utilizza esclusivamente cookie tecnici essenziali. Non utilizziamo cookie di profilazione o di terze parti per finalità pubblicitarie.</p>
          <ul>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>plasive_cookie</strong> — localStorage che memorizza il consenso al banner. Durata: persistente. Finalità: tecnica.</li>
            <li><strong style={{color:'var(--text)',fontWeight:400}}>Font Google</strong> — il sito carica Outfit da Google Fonts. Google potrebbe raccogliere dati secondo la propria <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" style={{color:'var(--accent)',textDecoration:'none'}}>Privacy Policy</a>.</li>
          </ul>
        </section>

        <div className="pp-divider"/>

        <section className="pp-section" id="contatti">
          <span className="pp-section-num">09 — Contatti</span>
          <h2>Contatti</h2>
          <div className="pp-infobox">
            <p><strong>Plasive Technologies S.r.l.</strong><br/>Via Cesare Battisti 26, 40123 Bologna (BO), Italia<br/>Email: <a href="mailto:info@plasive.tech" style={{color:'var(--accent)',textDecoration:'none'}}>info@plasive.tech</a></p>
          </div>
        </section>
      </main>

      <footer className="pp-footer">
        <span className="pp-footer-text">© 2026 Plasive Technologies S.r.l. — P.IVA 03736701206</span>
        <Link href="/">← Torna al sito</Link>
      </footer>
    </>
  );
}
