import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Industries — Plasive Technologies',
  description: 'Plasive builds data products for Agroforestry, Legal & Privacy, Healthcare, and Streaming industries.',
};

const industries = [
  {
    key: 'agro',
    title: 'Agroforestry & Foodchain',
    description: 'From multi-terabyte remote sensing analytics to nutritional labels, we protect the full farm-to-fork chain.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12"/>
        <path d="M12 12a8 8 0 0 0-8-8c0 4.5 3.5 8 8 8z"/>
        <path d="M12 12a8 8 0 0 1 8-8c0 4.5-3.5 8-8 8z"/>
        <path d="M12 17a5 5 0 0 0-5-5c0 3 2 5 5 5z"/>
        <line x1="5" y1="22" x2="19" y2="22"/>
      </svg>
    ),
    features: [
      'Sensor-to-cloud data mesh for crop & equipment telemetry',
      'Distributed parallel computing systems',
      'Predictive agronomic forecasting and yield optimization',
      'Food safety compliance packs: labels, lot genealogy, audits',
    ],
  },
  {
    key: 'legal',
    title: 'Legal & Privacy',
    description: 'GDPR-grade governance with auditability baked into every workflow and data exchange.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    features: [
      'Consent orchestration with purpose & lawful-basis tracking',
      'Data discovery, privacy-by-design and privacy-by-default best practice',
      'Immutable evidence vaults for audits and legal holds',
      'Retention, erasure, and vendor workflows with proof of execution',
    ],
  },
  {
    key: 'health',
    title: 'Healthcare & Digital Signature',
    description: 'Clinical data, HL7 interoperability, and on-prem digital signature rails designed to stay compliant.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    features: [
      'FHIR/HL7 integration hub with validation and mapping',
      'On-prem digital signature and timestamping rails',
      'Analytics workspaces with fine-grained access control',
      'eConsent, audit-ready trails, and clinical traceability',
    ],
  },
  {
    key: 'streaming',
    title: 'Streaming & Video-On-Demand',
    description: 'Low-latency ingest paired with data lakes so every stream is captured, searchable, and monetizable.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 10.5A10 10 0 0 1 12 2a10 10 0 0 1 10 8.5"/>
        <path d="M5 13A7 7 0 0 1 12 6a7 7 0 0 1 7 7"/>
        <path d="M8.5 15.5A3.5 3.5 0 0 1 12 12a3.5 3.5 0 0 1 3.5 3.5"/>
        <circle cx="12" cy="20" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
    features: [
      'Low-latency ingest with edge-friendly encoding & CDN routing',
      'QoE observability, SLO dashboards, and proactive alerting',
      'Audience intelligence pipelines for segmentation',
      'Real-time anomaly detection and anti-fraud guardrails',
    ],
  },
];

export default function IndustriesPage() {
  return (
    <>
      <style>{`
        html, body { overflow: auto !important; height: auto !important; }

        .ind-page {
          min-height: 100vh;
          background: var(--bg);
          font-family: var(--font);
          padding-top: 88px;
          padding-bottom: 60px;
        }

        /* ── Left pill: back + breadcrumb ── */
        .ind-back {
          position: fixed;
          top: 14px;
          left: 22px;
          z-index: 60;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--glass-bg);
          backdrop-filter: var(--blur);
          -webkit-backdrop-filter: var(--blur);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 7px 14px;
          font-family: var(--font);
          font-size: 8px;
          font-weight: 400;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: var(--text-m);
          text-decoration: none;
          transition: border-color 0.25s, color 0.25s;
        }
        .ind-back:hover { border-color: var(--border-h); color: var(--text); }
        .ind-back svg { opacity: 0.6; }
        .ind-breadcrumb-sep { width: 1px; height: 10px; background: var(--border); }

        /* ── Main content ── */
        .ind-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .ind-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .ind-card {
          background: var(--glass-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: border-color 0.25s;
        }
        .ind-card:hover { border-color: var(--border-h); }

        .ind-icon {
          color: var(--text-m);
          opacity: 0.8;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
        }

        .ind-title {
          font-size: 19px;
          font-weight: 500;
          color: var(--text);
          letter-spacing: -0.01em;
          line-height: 1.2;
        }

        .ind-desc {
          font-size: 13px;
          font-weight: 300;
          color: var(--text-m);
          line-height: 1.65;
          max-width: 460px;
        }

        .ind-features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
          margin-top: 2px;
        }

        .ind-feat {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: rgba(8, 14, 24, 0.5);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 11px 13px;
          font-size: 12px;
          font-weight: 300;
          color: var(--text-m);
          line-height: 1.5;
        }

        .ind-check {
          color: var(--accent);
          flex-shrink: 0;
          margin-top: 2px;
          opacity: 0.75;
        }

        @media (max-width: 768px) {
          .ind-page { padding-top: 72px; }
          .ind-main { padding: 0 14px; }
          .ind-back { left: 14px; }
          .ind-grid { grid-template-columns: 1fr; gap: 10px; }
          .ind-card { padding: 20px; }
          .ind-features { grid-template-columns: 1fr; }
          .ind-title { font-size: 17px; }
        }
      `}</style>

      {/* Top-left: Plasive. brand identico al main site */}
      <Link href="/" className="ind-back">
        <span className="logo" style={{ letterSpacing: '0.06em', textTransform: 'none' }}>Plasive.</span>
        <span className="ind-breadcrumb-sep" />
        <span style={{ fontFamily: 'var(--font)', fontSize: '8px', fontWeight: 400, letterSpacing: '0.10em', textTransform: 'uppercase' as const, color: 'var(--text-m)' }}>Industries</span>
      </Link>

      {/* Top-right: contact link */}
      <header className="site-header">
        <a href="mailto:info@plasive.tech" className="logo" style={{ letterSpacing: '0.04em', fontWeight: 400, opacity: 0.6 }}>
          Contact Us
        </a>
      </header>

      <div className="ind-page">
        <main className="ind-main">
          <div className="ind-grid">
            {industries.map((ind) => (
              <div className="ind-card" key={ind.key}>
                <div className="ind-icon">{ind.icon}</div>
                <h2 className="ind-title">{ind.title}</h2>
                <p className="ind-desc">{ind.description}</p>
                <div className="ind-features">
                  {ind.features.map((f, i) => (
                    <div className="ind-feat" key={i}>
                      <svg className="ind-check" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
