import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

export interface Transaction {
  id: string;
  groupId: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive = masuk, negative = keluar
  category?: string;
  imageUrl?: string; // e.g. /uploads/<uuid>.jpg
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  createdAt: string;
  transactionCount?: number;
}

export interface GroupStats {
  saldo: number;
  totalMasuk: number;
  totalKeluar: number;
  transactionCount: number;
}

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'finance.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------- Schema ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS groups (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    password  TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id          TEXT PRIMARY KEY,
    groupId     TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    date        TEXT NOT NULL,
    description TEXT NOT NULL,
    amount      INTEGER NOT NULL,
    category    TEXT,
    imageUrl    TEXT,
    createdAt   TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_tx_group ON transactions(groupId);
  CREATE INDEX IF NOT EXISTS idx_tx_date  ON transactions(date DESC);
`);

// ---------- Seed (first run only) ----------
function seed(): void {
  const row = db.prepare('SELECT COUNT(*) AS c FROM settings').get() as { c: number };
  if (row.c > 0) return;

  const defaultPin = process.env.ADMIN_PIN || '123456';
  setSetting('adminPinHash', bcrypt.hashSync(defaultPin, 10));
  setSetting('initializedAt', new Date().toISOString());
  console.log('[db] Initialized fresh database.');
  if (!process.env.ADMIN_PIN) {
    console.warn('[db] WARNING: using default admin PIN. Set ADMIN_PIN env var to override!');
  }
}

// ---------- Settings ----------
export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row ? row.value : null;
}

export function setSetting(key: string, value: string): void {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}

export function verifyAdminPin(pin: string): boolean {
  const hash = getSetting('adminPinHash');
  if (!hash) return false;
  return bcrypt.compareSync(String(pin).trim(), hash);
}

export function setAdminPin(newPin: string): void {
  setSetting('adminPinHash', bcrypt.hashSync(newPin.trim(), 10));
}

seed();

// ---------- Groups ----------
export function listGroups(): Group[] {
  return db
    .prepare(
      `SELECT g.id, g.name, g.createdAt,
              (SELECT COUNT(*) FROM transactions t WHERE t.groupId = g.id) AS transactionCount
       FROM groups g
       ORDER BY g.createdAt ASC`
    )
    .all() as Group[];
}

export function findGroup(id: string): (Group & { passwordHash: string }) | null {
  const row = db
    .prepare('SELECT id, name, createdAt, password AS passwordHash FROM groups WHERE id = ?')
    .get(id) as (Group & { passwordHash: string }) | undefined;
  return row || null;
}

export function createGroup(name: string, password: string): Group {
  const id = 'kel-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO groups (id, name, password, createdAt) VALUES (?, ?, ?, ?)').run(
    id,
    name.trim(),
    bcrypt.hashSync(password.trim(), 10),
    createdAt
  );
  return { id, name: name.trim(), createdAt, transactionCount: 0 };
}

export function updateGroup(
  id: string,
  payload: { name?: string; password?: string }
): Group | null {
  if (!findGroup(id)) return null;

  if (payload.name && payload.name.trim()) {
    db.prepare('UPDATE groups SET name = ? WHERE id = ?').run(payload.name.trim(), id);
  }
  // Only touch the password when a non-empty value is supplied.
  // Guard against accidentally re-hashing an already-hashed value
  // (frontends have previously echoed the bcrypt hash back into the form).
  const newPassword = payload.password?.trim();
  if (newPassword && !newPassword.startsWith('$2a$') && !newPassword.startsWith('$2b$')) {
    db.prepare('UPDATE groups SET password = ? WHERE id = ?').run(
      bcrypt.hashSync(newPassword, 10),
      id
    );
  }
  return listGroups().find((g) => g.id === id) || null;
}

export function deleteGroup(id: string): boolean {
  return db.prepare('DELETE FROM groups WHERE id = ?').run(id).changes > 0;
}

export function verifyGroupPassword(id: string, password: string): boolean {
  const group = findGroup(id);
  if (!group) return false;
  return bcrypt.compareSync(String(password).trim(), group.passwordHash);
}

// ---------- Transactions ----------
function mapTx(row: any): Transaction {
  return {
    id: row.id,
    groupId: row.groupId,
    date: row.date,
    description: row.description,
    amount: row.amount,
    category: row.category ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    createdAt: row.createdAt,
  };
}

export function listTransactions(groupId?: string): Transaction[] {
  const rows = groupId
    ? db
        .prepare('SELECT * FROM transactions WHERE groupId = ? ORDER BY date DESC, createdAt DESC')
        .all(groupId)
    : db.prepare('SELECT * FROM transactions ORDER BY date DESC, createdAt DESC').all();
  return (rows as any[]).map(mapTx);
}

export function getGroupStats(groupId: string): GroupStats {
  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) AS totalMasuk,
         COALESCE(SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END), 0) AS totalKeluar,
         COUNT(*) AS transactionCount
       FROM transactions WHERE groupId = ?`
    )
    .get(groupId) as { totalMasuk: number; totalKeluar: number; transactionCount: number };
  return {
    totalMasuk: row.totalMasuk,
    totalKeluar: row.totalKeluar,
    saldo: row.totalMasuk - row.totalKeluar,
    transactionCount: row.transactionCount,
  };
}

export function findTransaction(id: string): Transaction | null {
  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
  return row ? mapTx(row) : null;
}

export function createTransaction(input: {
  groupId: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  imageUrl?: string;
}): Transaction {
  const id = 'tx-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO transactions (id, groupId, date, description, amount, category, imageUrl, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.groupId,
    input.date,
    input.description.trim(),
    Math.round(input.amount),
    input.category?.trim() || null,
    input.imageUrl || null,
    createdAt
  );
  return findTransaction(id)!;
}

export function updateTransaction(
  id: string,
  payload: {
    groupId?: string;
    date?: string;
    description?: string;
    amount?: number;
    category?: string;
    imageUrl?: string;
  }
): Transaction | null {
  const tx = findTransaction(id);
  if (!tx) return null;

  db.prepare(
    `UPDATE transactions SET groupId = ?, date = ?, description = ?, amount = ?, category = ?, imageUrl = ?
     WHERE id = ?`
  ).run(
    payload.groupId ?? tx.groupId,
    payload.date ?? tx.date,
    payload.description?.trim() || tx.description,
    payload.amount !== undefined ? Math.round(payload.amount) : tx.amount,
    payload.category !== undefined ? payload.category.trim() || null : tx.category ?? null,
    payload.imageUrl !== undefined ? payload.imageUrl || null : tx.imageUrl ?? null,
    id
  );

  return findTransaction(id);
}

export function deleteTransaction(id: string): boolean {
  return db.prepare('DELETE FROM transactions WHERE id = ?').run(id).changes > 0;
}