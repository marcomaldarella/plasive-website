import { fetchContent } from '@/lib/content';
import SiteClient from '@/components/SiteClient';

export const revalidate = 60;

export default async function Page() {
  const content = await fetchContent();
  return <SiteClient content={content} />;
}
