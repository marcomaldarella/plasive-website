import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'rya3hgiq',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN ?? '',
  useCdn: false,
});

const doc = {
  _id:   'homepage',
  _type: 'homepage',

  homeTitle:    'Plasive Tech.',
  homeSubtitle: 'We craft technologies that helps you to safely play with data, discover insights, and do the right thing.',

  rdEyebrow:  'Research & Development',
  rdTitle:    "From project management to analytics, we're shaping the future of data.",
  rdSubtitle: 'Research and development for data-heavy, regulated environments. We design, build, and operate systems you can trust.',

  missionTitle:    'Build resilient, privacy-first data products.',
  missionSubtitle: 'Governance, cloud architecture, and security engineering delivered with measurable outcomes.',
  industries: [
    'Agroforestry & Foodchain',
    'Legal & Privacy',
    'Healthcare & Digital Signature',
    'Streaming & VOD',
  ],

  servicesEyebrow: 'Research & Development',
  services: [
    { _key: 'analytics', title: 'Data Analytics',            description: 'Harness the power of analysis to derive actionable insights from your data.' },
    { _key: 'cloud',     title: 'Cloud Architecture',        description: 'Planet scale, resilient, and efficient solutions built for the modern cloud ecosystem.' },
    { _key: 'security',  title: 'Enterprise-Grade Security', description: 'OSCP state-of-the-art security measures to protect your most valuable assets.' },
    { _key: 'perf',      title: 'High-Performance Systems',  description: 'Optimized for speed and efficiency, our solutions deliver unparalleled performance.' },
  ],

  contactEyebrow:  "Let's Talk",
  contactTitle:    'Build resilient, privacy-first data products.',
  contactSubtitle: 'Governance, cloud architecture, and security engineering delivered with measurable outcomes.',

  companyName: 'Plasive Technologies S.r.l.',
  taxId:       'TAX ID 03736701206',
  address:     'Via Cesare Battisti 26',
  city:        '40123 Bologna, Italy',
  email:       'info@plasive.tech',
  linkedinUrl: 'https://www.linkedin.com/company/plasivetech',
};

async function seed(): Promise<void> {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('Missing SANITY_API_TOKEN env var');
    process.exit(1);
  }
  try {
    const result = await client.createOrReplace(doc);
    console.log('Seeded:', result._id);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

void seed();
