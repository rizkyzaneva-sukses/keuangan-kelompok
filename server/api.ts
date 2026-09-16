import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  listGroups,
  findGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  verifyGroupPassword,
  listTransactions,
  getGroupStats,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  verifyAdminPin,
  setAdminPin,
  findTransaction,
} from './db.js';

export const apiRouter = Router();

const MAX_AMOUNT = 1_000_000_000; // 1 miliar
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------- Upload storage ----------
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'data/uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = ALLOWED_MIME[file.mimetype] || '.bin';
      cb(null, crypto.randomUUID() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME[file.mimetype]) {
      return cb(new Error('Tipe file tidak diizinkan. Gunakan JPG, PNG, WEBP, atau GIF.'));
    }
    cb(null, true);
  },
});

// ---------- Rate limiters ----------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
});

const unlockLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
});

// ---------- Helpers ----------
function clean(v: unknown, max = 200): string {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
}

function isSafeImageRef(v: string): boolean {
  if (!v) return true;
  if (/^\/uploads\/[A-Za-z0-9._-]+$/.test(v)) return true;
  return /^https?:\/\//i.test(v);
}

interface TxValidation {
  error?: string;
  data?: {
    groupId?: string;
    date?: string;
    description?: string;
    amount?: number;
    category?: string;
    imageUrl?: string;
  };
}

function validateTxPayload(body: any, opts: { partial: boolean }): TxValidation {
  const out: NonNullable<TxValidation['data']> = {};

  if (!opts.partial || body.groupId !== undefined) {
    const groupId = clean(body.groupId, 64);
    if (!groupId) return { error: 'Pilih kelompok terlebih dahulu.' };
    out.groupId = groupId;
  }

  if (!opts.partial || body.description !== undefined) {
    const description = clean(body.description, 300);
    if (!description) return { error: 'Keterangan transaksi wajib diisi.' };
    out.description = description;
  }

  if (!opts.partial || body.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount === 0) {
      return { error: 'Nominal harus angka valid dan bukan 0.' };
    }
    if (Math.abs(amount) > MAX_AMOUNT) {
      return { error: 'Nominal terlalu besar (maksimal 1 miliar).' };
    }
    out.amount = amount;
  }

  if (body.date !== undefined) {
    const date = clean(body.date, 10);
    if (date && !DATE_RE.test(date)) return { error: 'Format tanggal harus YYYY-MM-DD.' };
    if (date) out.date = date;
  }

  if (body.category !== undefined) {
    out.category = clean(body.category, 60);
  }

  if (body.imageUrl !== undefined) {
    const imageUrl = clean(body.imageUrl, 500);
    if (imageUrl && !isSafeImageRef(imageUrl)) {
      return { error: 'Referensi gambar tidak valid.' };
    }
    out.imageUrl = imageUrl;
  }

  return { data: out };
}

function checkAdmin(req: Request, res: Response, next: NextFunction) {
  const pin = req.headers['x-admin-pin'];
  if (typeof pin !== 'string' || !verifyAdminPin(pin)) {
    res
      .status(403)
      .json({ success: false, error: 'Akses ditolak: PIN Pengelola salah atau belum dimasukkan.' });
    return;
  }
  next();
}

function wrap(handler: (req: Request, res: Response) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      handler(req, res);
    } catch (err) {
      next(err);
    }
  };
}

// ================= PUBLIC =================

apiRouter.get(
  '/public/groups',
  wrap((_req, res) => {
    res.json({ success: true, groups: listGroups() });
  })
);

apiRouter.post(
  '/public/groups/:id/unlock',
  unlockLimiter,
  wrap((req, res) => {
    const id = clean(req.params.id, 64);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    const group = findGroup(id);
    if (!group) {
      res.status(404).json({ success: false, error: 'Kelompok tidak ditemukan.' });
      return;
    }
    if (!verifyGroupPassword(id, password)) {
      res.status(401).json({ success: false, error: 'Password kelompok salah! Silakan coba lagi.' });
      return;
    }

    res.json({
      success: true,
      group: { id: group.id, name: group.name, createdAt: group.createdAt },
      stats: getGroupStats(id),
      transactions: listTransactions(id),
    });
  })
);

apiRouter.get(
  '/public/stats',
  wrap((_req, res) => {
    const groups = listGroups();
    const totals = groups.reduce(
      (acc, g) => {
        const s = getGroupStats(g.id);
        acc.transactionCount += s.transactionCount;
        return acc;
      },
      { transactionCount: 0 }
    );
    res.json({ success: true, groupCount: groups.length, transactionCount: totals.transactionCount });
  })
);

// ================= ADMIN AUTH =================

apiRouter.post(
  '/admin/login',
  loginLimiter,
  wrap((req, res) => {
    const pin = typeof req.body?.pin === 'string' ? req.body.pin : '';
    if (!pin.trim()) {
      res.status(400).json({ success: false, error: 'PIN wajib diisi.' });
      return;
    }
    if (verifyAdminPin(pin)) {
      res.json({ success: true, message: 'Login admin berhasil.' });
      return;
    }
    res.status(401).json({ success: false, error: 'PIN Pengelola salah.' });
  })
);

apiRouter.post(
  '/admin/change-pin',
  checkAdmin,
  wrap((req, res) => {
    const newPin = typeof req.body?.newPin === 'string' ? req.body.newPin.trim() : '';
    if (newPin.length < 6) {
      res.status(400).json({ success: false, error: 'PIN baru minimal 6 karakter.' });
      return;
    }
    setAdminPin(newPin);
    res.json({ success: true, message: 'PIN Pengelola berhasil diubah.' });
  })
);

// ================= ADMIN DATA =================

apiRouter.get(
  '/admin/data',
  checkAdmin,
  wrap((_req, res) => {
    const groups = listGroups().map((g) => ({ ...g, ...getGroupStats(g.id) }));
    res.json({ success: true, groups, transactions: listTransactions() });
  })
);

// ================= ADMIN GROUPS =================

apiRouter.post(
  '/admin/groups',
  checkAdmin,
  wrap((req, res) => {
    const name = clean(req.body?.name, 120);
    const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';

    if (!name) {
      res.status(400).json({ success: false, error: 'Nama kelompok wajib diisi.' });
      return;
    }
    if (password.length < 4) {
      res.status(400).json({ success: false, error: 'Password view kelompok minimal 4 karakter.' });
      return;
    }

    res.json({ success: true, group: createGroup(name, password) });
  })
);

apiRouter.put(
  '/admin/groups/:id',
  checkAdmin,
  wrap((req, res) => {
    const id = clean(req.params.id, 64);
    const payload: { name?: string; password?: string } = {};

    if (req.body?.name !== undefined) {
      const name = clean(req.body.name, 120);
      if (!name) {
        res.status(400).json({ success: false, error: 'Nama kelompok tidak valid.' });
        return;
      }
      payload.name = name;
    }
    if (req.body?.password !== undefined) {
      const password = String(req.body.password).trim();
      if (password && password.length < 4) {
        res
          .status(400)
          .json({ success: false, error: 'Password view kelompok minimal 4 karakter.' });
        return;
      }
      if (password) payload.password = password;
    }

    const group = updateGroup(id, payload);
    if (!group) {
      res.status(404).json({ success: false, error: 'Kelompok tidak ditemukan.' });
      return;
    }
    res.json({ success: true, group });
  })
);

apiRouter.delete(
  '/admin/groups/:id',
  checkAdmin,
  wrap((req, res) => {
    const id = clean(req.params.id, 64);
    if (!deleteGroup(id)) {
      res.status(404).json({ success: false, error: 'Kelompok tidak ditemukan.' });
      return;
    }
    res.json({ success: true, message: 'Kelompok dan transaksi terkait berhasil dihapus.' });
  })
);

// ================= ADMIN TRANSACTIONS =================

apiRouter.post(
  '/admin/transactions',
  checkAdmin,
  wrap((req, res) => {
    const v = validateTxPayload(req.body || {}, { partial: false });
    if (v.error || !v.data) {
      res.status(400).json({ success: false, error: v.error });
      return;
    }
    if (!findGroup(v.data.groupId!)) {
      res.status(404).json({ success: false, error: 'Kelompok tidak ditemukan.' });
      return;
    }

    const tx = createTransaction({
      groupId: v.data.groupId!,
      date: v.data.date || new Date().toISOString().split('T')[0],
      description: v.data.description!,
      amount: v.data.amount!,
      category: v.data.category,
      imageUrl: v.data.imageUrl,
    });

    res.json({ success: true, transaction: tx });
  })
);

apiRouter.put(
  '/admin/transactions/:id',
  checkAdmin,
  wrap((req, res) => {
    const id = clean(req.params.id, 64);
    if (!findTransaction(id)) {
      res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan.' });
      return;
    }

    const v = validateTxPayload(req.body || {}, { partial: true });
    if (v.error || !v.data) {
      res.status(400).json({ success: false, error: v.error });
      return;
    }
    if (v.data.groupId && !findGroup(v.data.groupId)) {
      res.status(404).json({ success: false, error: 'Kelompok tidak ditemukan.' });
      return;
    }

    res.json({ success: true, transaction: updateTransaction(id, v.data) });
  })
);

apiRouter.delete(
  '/admin/transactions/:id',
  checkAdmin,
  wrap((req, res) => {
    const id = clean(req.params.id, 64);
    if (!deleteTransaction(id)) {
      res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan.' });
      return;
    }
    res.json({ success: true, message: 'Transaksi berhasil dihapus.' });
  })
);

// ================= UPLOAD =================

apiRouter.post('/admin/upload', checkAdmin, (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      const msg =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Ukuran file maksimal 5MB.'
          : err.message || 'Gagal mengunggah file.';
      res.status(400).json({ success: false, error: msg });
      return;
    }
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ success: false, error: 'Tidak ada file yang diunggah.' });
      return;
    }
    res.json({ success: true, url: `/uploads/${file.filename}` });
  });
});