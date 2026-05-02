export interface BusinessCard {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  phones: string[]; // At least one mandatory
  email?: string;
  catchphrase: string;
  logoUrl: string;
  theme: "light" | "dark";
  accentColor: string;
  customBgColor?: string;
  customTextColor?: string;
  backgroundUrl?: string;
  website?: string;
  qrLink?: string;
  layout: "standard" | "centered" | "split";
  profileId: string; // "guest" or a specific profile ID
}
