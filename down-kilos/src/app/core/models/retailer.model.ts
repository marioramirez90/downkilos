export interface Retailer {
  id: string;
  name: string;
  shortName: string;
  badgeBg: string;
  badgeColor: string;
  isAvailable: boolean; // only Netto is true in V1
}

export interface StoreBranch {
  id: string;
  name: string;
  street: string;
  postalCode: string;
  city: string;
}

export interface RetailerPreference {
  retailerId: string;
  retailerName: string;
  branch?: StoreBranch;
  postalCode: string;
  city: string;
  weeklyBudget: number;
}

export const SUPPORTED_RETAILERS: Retailer[] = [
  {
    id: 'netto',
    name: 'Netto Marken-Discount',
    shortName: 'Netto',
    badgeBg: '#FFF200',
    badgeColor: '#ED1C24',
    isAvailable: true
  },
  {
    id: 'rewe',
    name: 'REWE',
    shortName: 'REWE',
    badgeBg: '#CC071E',
    badgeColor: '#FFFFFF',
    isAvailable: false
  },
  {
    id: 'edeka',
    name: 'EDEKA',
    shortName: 'EDEKA',
    badgeBg: '#005CA9',
    badgeColor: '#FFDD00',
    isAvailable: false
  },
  {
    id: 'aldi-sued',
    name: 'ALDI Süd',
    shortName: 'ALDI',
    badgeBg: '#001489',
    badgeColor: '#FFFFFF',
    isAvailable: false
  },
  {
    id: 'aldi-nord',
    name: 'ALDI Nord',
    shortName: 'ALDI Nord',
    badgeBg: '#002B7F',
    badgeColor: '#FFFFFF',
    isAvailable: false
  },
  {
    id: 'lidl',
    name: 'Lidl',
    shortName: 'Lidl',
    badgeBg: '#0050AA',
    badgeColor: '#FFF000',
    isAvailable: false
  },
  {
    id: 'penny',
    name: 'Penny',
    shortName: 'Penny',
    badgeBg: '#CD141D',
    badgeColor: '#FFFFFF',
    isAvailable: false
  },
  {
    id: 'kaufland',
    name: 'Kaufland',
    shortName: 'Kaufland',
    badgeBg: '#E2001A',
    badgeColor: '#FFFFFF',
    isAvailable: false
  }
];
