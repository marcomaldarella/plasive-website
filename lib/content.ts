import { client } from './sanity';
import type { HomepageContent } from '@/types/content';

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
    return await client.fetch<HomepageContent>(QUERY, {}, { next: { revalidate: 60 } });
  } catch {
    return null;
  }
}
