export interface ServiceItem {
  _key: string;
  title: string;
  description: string;
}

export interface HomepageContent {
  _id: string;
  _type: 'homepage';

  // Panel 01
  homeTitle: string;
  homeSubtitle: string;

  // Panel 02 R&D
  rdEyebrow: string;
  rdTitle: string;
  rdSubtitle: string;

  // Panel 03 Mission
  missionTitle: string;
  missionSubtitle: string;
  industries: string[];

  // Panel 04 Services
  servicesEyebrow: string;
  services: ServiceItem[];

  // Panel 05 Contact
  contactEyebrow: string;
  contactTitle: string;
  contactSubtitle: string;

  // Company info
  companyName: string;
  taxId: string;
  address: string;
  city: string;
  email: string;
  linkedinUrl: string;
}
