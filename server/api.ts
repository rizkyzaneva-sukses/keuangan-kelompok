import { Router, Request, Response } from 'express';
import { getDb, saveDb, Group, Transaction } from './db.js';

export const apiRouter = Router();

// Middleware to parse json is applied at app level

// --- PUBLIC ENDPOINTS ---

// 1. List groups for public selection (id & name only, no passwords)
apiRouter.get('/public/groups', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const publicGroups = db.groups.map(g => {
      const groupTx = db.transactions.filter(t => t.groupId === g.id);
      return {
        id: g.id,
        name: g.name,
        createdAt: g.createdAt,
        transactionCount: groupTx.length,
      };
    });
    res.json({ success: true, groups: publicGroups });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Unlock & view group data with password (view only)
apiRouter.post('/public/groups/:id/unlock', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const db = getDb();
    const group = db.groups.find(g => g.id === id);

    if (!group) {
      return res.status(404).json({ success: false, error: 'Kelompok tidak ditemukan.' });
    }

    // Compare password (case-sensitive or trimmed)
    if ((group.password || '').trim() !== (password || '').trim()) {
      return res.status(401).json({ success: false, error: 'Password kelompok salah! Silakan coba lagi.' });
    }

    // Filter transactions for this group
    const transactions = db.transactions
      .filter(t => t.groupId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalMasuk = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalKeluar = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const saldo = totalMasuk - totalKeluar;

    res.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        createdAt: group.createdAt,
      },
      stats: {
        saldo,
        totalMasuk,
        totalKeluar,
        transactionCount: transactions.length,
      },
      transactions,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- ADMIN ENDPOINTS ---

function checkAdmin(req: Request, res: Response, next: () => void) {
  const pin = req.headers['x-admin-pin'] as string;
  const db = getDb();
  if (!pin || pin.trim() !== db.adminPin.trim()) {
    return res.status(403).json({ success: false, error: 'Akses ditolak: PIN Pengelola salah atau belum dimasukkan.' });
  }
  next();
}

// 3. Admin login verification
apiRouter.post('/admin/login', (req: Request, res: Response) => {
  try {
    const { pin } = req.body;
    const db = getDb();
    if ((pin || '').trim() === db.adminPin.trim()) {
      return res.json({ success: true, message: 'Login admin berhasil.' });
    }
    return res.status(401).json({ success: false, error: 'PIN Pengelola salah.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Admin change PIN
apiRouter.post('/admin/change-pin', checkAdmin, (req: Request, res: Response) => {
  try {
    const { newPin } = req.body;
    if (!newPin || newPin.trim().length < 4) {
      return res.status(400).json({ success: false, error: 'PIN baru minimal 4 karakter.' });
    }
    const db = getDb();
    db.adminPin = newPin.trim();
    saveDb(db);
    res.json({ success: true, message: 'PIN Pengelola berhasil diubah.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Admin get all groups & transactions
apiRouter.get('/admin/data', checkAdmin, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const groupsWithStats = db.groups.map(g => {
      const txs = db.transactions.filter(t => t.groupId === g.id);
      const totalMasuk = txs.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const totalKeluar = txs.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return {
        ...g,
        saldo: totalMasuk - totalKeluar,
        totalMasuk,
        totalKeluar,
        transactionCount: txs.length,
      };
    });

    res.json({
      success: true,
      groups: groupsWithStats,
      transactions: db.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Admin create group
apiRouter.post('/admin/groups', checkAdmin, (req: Request, res: Response) => {
  try {
    const { name, password } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Nama kelompok wajib diisi.' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ success: false, error: 'Password view kelompok wajib diisi.' });
    }

    const db = getDb();
    const id = 'kel-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const newGroup: Group = {
      id,
      name: name.trim(),
      password: password.trim(),
      createdAt: new Date().toISOString(),
    };

    db.groups.push(newGroup);
    saveDb(db);

    res.json({ success: true, group: newGroup });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Admin update group
apiRouter.put('/admin/groups/:id', checkAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, password } = req.body;

    const db = getDb();
    const group = db.groups.find(g => g.id === id);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Kelompok tidak ditemukan.' });
    }

    if (name && name.trim()) group.name = name.trim();
    if (password && password.trim()) group.password = password.trim();

    saveDb(db);
    res.json({ success: true, group });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Admin delete group
apiRouter.delete('/admin/groups/:id', checkAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();
    
    db.groups = db.groups.filter(g => g.id !== id);
    db.transactions = db.transactions.filter(t => t.groupId !== id);

    saveDb(db);
    res.json({ success: true, message: 'Kelompok dan transaksi terkait berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Admin add transaction
apiRouter.post('/admin/transactions', checkAdmin, (req: Request, res: Response) => {
  try {
    const { groupId, date, description, amount, category, imageUrl } = req.body;

    if (!groupId) {
      return res.status(400).json({ success: false, error: 'Pilih kelompok terlebih dahulu.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, error: 'Keterangan transaksi wajib diisi.' });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount === 0) {
      return res.status(400).json({ success: false, error: 'Nominal harus angka valid dan bukan 0.' });
    }

    const db = getDb();
    const groupExists = db.groups.some(g => g.id === groupId);
    if (!groupExists) {
      return res.status(404).json({ success: false, error: 'Kelompok tidak ditemukan.' });
    }

    const txDate = date && date.trim() ? date.trim() : new Date().toISOString().split('T')[0];
    const newTx: Transaction = {
      id: 'tx-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      groupId,
      date: txDate,
      description: description.trim(),
      amount: numAmount,
      category: category && category.trim() ? category.trim() : undefined,
      imageUrl: imageUrl || undefined,
      createdAt: new Date().toISOString(),
    };

    db.transactions.push(newTx);
    saveDb(db);

    res.json({ success: true, transaction: newTx });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Admin edit transaction
apiRouter.put('/admin/transactions/:id', checkAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, description, amount, category, imageUrl, groupId } = req.body;

    const db = getDb();
    const tx = db.transactions.find(t => t.id === id);
    if (!tx) {
      return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan.' });
    }

    if (date) tx.date = date;
    if (description && description.trim()) tx.description = description.trim();
    if (amount !== undefined && !isNaN(Number(amount)) && Number(amount) !== 0) {
      tx.amount = Number(amount);
    }
    if (category !== undefined) {
      tx.category = category && category.trim() ? category.trim() : undefined;
    }
    if (imageUrl !== undefined) tx.imageUrl = imageUrl;
    if (groupId) tx.groupId = groupId;

    saveDb(db);
    res.json({ success: true, transaction: tx });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Admin delete transaction
apiRouter.delete('/admin/transactions/:id', checkAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const initialLen = db.transactions.length;
    db.transactions = db.transactions.filter(t => t.id !== id);

    if (db.transactions.length === initialLen) {
      return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan.' });
    }

    saveDb(db);
    res.json({ success: true, message: 'Transaksi berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
