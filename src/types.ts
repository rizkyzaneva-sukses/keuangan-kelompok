export interface Transaction {
  id: string;
  groupId: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive = masuk (e.g. 200000), negative = keluar (e.g. -200000)
  category?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  password?: string; // only visible in admin mode
  createdAt: string;
  saldo?: number;
  totalMasuk?: number;
  totalKeluar?: number;
  transactionCount?: number;
}

export interface GroupStats {
  saldo: number;
  totalMasuk: number;
  totalKeluar: number;
  transactionCount: number;
}
