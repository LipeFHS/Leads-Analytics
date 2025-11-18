export enum LeadType {
  PAID = 'Paid',
  ORGANIC = 'Organic',
  DIRECT = 'Direct',
  REFERRAL = 'Referral'
}

export interface RawCsvRow {
  [key: string]: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  source: string;
  medium: string;
  campaign: string;
  url: string;
  type: LeadType;
}

export interface DashboardStats {
  total: number;
  paid: number;
  organic: number;
  direct: number;
  referral: number;
}