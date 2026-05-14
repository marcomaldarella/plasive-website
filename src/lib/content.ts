import { client } from './sanity.ts';
import type { HomepageContent } from '../types/content.ts';

const QUERY = `*[_type == "homepage"][0]{
  homeTitle, homeSubtitle,
  rdEyebrow, rdTitle, rdSubtitle,
  missionTitle, missionSubtitle, industries,
  servicesEyebrow, services[]{ _key, title, description },
  contactEyebrow, contactTitle, contactSubtitle,
  companyName, taxId, address, city, email, linkedinUrl
}`;

export async function fetchContent(): Promise<HomepageContent | null> {
  try {
    return await client.fetch<HomepageContent>(QUERY);
  } catch {
    return null;
  }
}

function setText(id: string, value: string | undefined): void {
  if (!value) return;
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}


export function hydrateContent(c: HomepageContent | null): void {
  if (!c) return;

  // Panel 01 Home
  setText('home-title',    c.homeTitle);
  setText('home-subtitle', c.homeSubtitle);

  // Panel 02 R&D
  setText('work-eyebrow',  c.rdEyebrow);
  setText('work-title',    c.rdTitle);
  setText('work-subtitle', c.rdSubtitle);

  // Panel 03 Mission
  setText('mission-title',    c.missionTitle);
  setText('mission-subtitle', c.missionSubtitle);
  if (c.industries?.length) {
    const ul = document.getElementById('industries-list');
    if (ul) {
      ul.innerHTML = c.industries.map(i => `<li>${i}</li>`).join('');
    }
  }

  // Panel 04 Services
  setText('svc-eyebrow', c.servicesEyebrow);
  if (c.services?.length) {
    c.services.forEach((svc, idx) => {
      const item = document.querySelector<HTMLElement>(`.svc-item[data-svc-idx="${idx}"]`);
      if (!item) return;
      const h3 = item.querySelector('h3');
      const p  = item.querySelector('p');
      if (h3) h3.textContent = svc.title;
      if (p)  p.textContent  = svc.description;
    });
  }

  // Panel 05 Contact
  setText('contact-eyebrow',  c.contactEyebrow);
  setText('contact-title',    c.contactTitle);
  setText('contact-subtitle', c.contactSubtitle);

  // Company info
  setText('ci-company-name', c.companyName);
  setText('ci-tax-id',       c.taxId);
  setText('ci-address',      c.address);
  setText('ci-city',         c.city);
  const emailEl = document.getElementById('ci-email');
  if (emailEl && c.email) {
    emailEl.textContent = c.email;
    emailEl.setAttribute('href', `mailto:${c.email}`);
  }
  const linkedinEl = document.getElementById('ci-linkedin');
  if (linkedinEl && c.linkedinUrl) {
    linkedinEl.setAttribute('href', c.linkedinUrl);
  }
}
