export interface ContactGroupSummary {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  createdAt: string;
}

export interface ContactLead {
  id: string;
  name: string;
  company: string;
  email: string;
  status: string;
  source: string;
  title?: string | null;
}
