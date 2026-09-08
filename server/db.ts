import fs from 'node:fs';
import path from 'node:path';

export interface Transaction {
  id: string;
  groupId: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive = masuk (e.g. 200000), negative = keluar (e.g. -200000)
  category?: string;
  imageUrl?: string; // base64 data url or image path
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  password: string; // Password untuk anggota melihat saldo (view only tanpa username)
  createdAt: string;
}

export interface AppDatabase {
  adminPin: string; // PIN Pengelola untuk input transaksi & kelola kelompok
  groups: Group[];
  transactions: Transaction[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'finance_db.json');

// Sample initial data if DB doesn't exist
const INITIAL_DATA: AppDatabase = {
  adminPin: '123456', // Default PIN admin, bisa diubah
  groups: [
    {
      id: 'kel-rt-05',
      name: 'Kas RT 05 / RW 02',
      password: 'kasrt',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'kel-futsal',
      name: 'Kas Tim Futsal Juara',
      password: 'futsal2026',
      createdAt: '2026-02-01T00:00:00.000Z',
    },
  ],
  transactions: [
    {
      id: 'tx-1',
      groupId: 'kel-rt-05',
      date: '2026-09-01',
      description: 'Iuran Warga Blok A & B',
      amount: 450000,
      createdAt: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'tx-2',
      groupId: 'kel-rt-05',
      date: '2026-09-03',
      description: 'Beli Lampu Penerangan Jalan & Kabel',
      amount: -185000,
      createdAt: '2026-09-03T10:30:00.000Z',
    },
    {
      id: 'tx-3',
      groupId: 'kel-rt-05',
      date: '2026-09-06',
      description: 'Sumbangan Donatur Kegiatan Kerja Bakti',
      amount: 200000,
      createdAt: '2026-09-06T14:15:00.000Z',
    },
    {
      id: 'tx-4',
      groupId: 'kel-futsal',
      date: '2026-09-02',
      description: 'Uang Kas Masuk dari 10 Pemain',
      amount: 250000,
      createdAt: '2026-09-02T19:00:00.000Z',
    },
    {
      id: 'tx-5',
      groupId: 'kel-futsal',
      date: '2026-09-05',
      description: 'Sewa Lapangan 2 Jam',
      amount: -200000,
      createdAt: '2026-09-05T21:00:00.000Z',
    },
  ],
};

function ensureDbFile(): AppDatabase {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
      return INITIAL_DATA;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content) as AppDatabase;
  } catch (err) {
    console.error('Error reading DB, using initial data:', err);
    return INITIAL_DATA;
  }
}

export function getDb(): AppDatabase {
  return ensureDbFile();
}

export function saveDb(data: AppDatabase): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}
