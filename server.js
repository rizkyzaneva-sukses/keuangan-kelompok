// server.ts
import express from "express";
import path2 from "node:path";

// server/api.ts
import { Router } from "express";

// server/db.ts
import fs from "node:fs";
import path from "node:path";
var DB_DIR = path.resolve(process.cwd(), "data");
var DB_FILE = path.join(DB_DIR, "finance_db.json");
var INITIAL_DATA = {
  adminPin: "123456",
  // Default PIN admin, bisa diubah
  groups: [
    {
      id: "kel-rt-05",
      name: "Kas RT 05 / RW 02",
      password: "kasrt",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "kel-futsal",
      name: "Kas Tim Futsal Juara",
      password: "futsal2026",
      createdAt: "2026-02-01T00:00:00.000Z"
    }
  ],
  transactions: [
    {
      id: "tx-1",
      groupId: "kel-rt-05",
      date: "2026-09-01",
      description: "Iuran Warga Blok A & B",
      amount: 45e4,
      createdAt: "2026-09-01T08:00:00.000Z"
    },
    {
      id: "tx-2",
      groupId: "kel-rt-05",
      date: "2026-09-03",
      description: "Beli Lampu Penerangan Jalan & Kabel",
      amount: -185e3,
      createdAt: "2026-09-03T10:30:00.000Z"
    },
    {
      id: "tx-3",
      groupId: "kel-rt-05",
      date: "2026-09-06",
      description: "Sumbangan Donatur Kegiatan Kerja Bakti",
      amount: 2e5,
      createdAt: "2026-09-06T14:15:00.000Z"
    },
    {
      id: "tx-4",
      groupId: "kel-futsal",
      date: "2026-09-02",
      description: "Uang Kas Masuk dari 10 Pemain",
      amount: 25e4,
      createdAt: "2026-09-02T19:00:00.000Z"
    },
    {
      id: "tx-5",
      groupId: "kel-futsal",
      date: "2026-09-05",
      description: "Sewa Lapangan 2 Jam",
      amount: -2e5,
      createdAt: "2026-09-05T21:00:00.000Z"
    }
  ]
};
function ensureDbFile() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), "utf-8");
      return INITIAL_DATA;
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading DB, using initial data:", err);
    return INITIAL_DATA;
  }
}
function getDb() {
  return ensureDbFile();
}
function saveDb(data) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving DB:", err);
  }
}

// server/api.ts
var apiRouter = Router();
apiRouter.get("/public/groups", (req, res) => {
  try {
    const db = getDb();
    const publicGroups = db.groups.map((g) => {
      const groupTx = db.transactions.filter((t) => t.groupId === g.id);
      return {
        id: g.id,
        name: g.name,
        createdAt: g.createdAt,
        transactionCount: groupTx.length
      };
    });
    res.json({ success: true, groups: publicGroups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
apiRouter.post("/public/groups/:id/unlock", (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const db = getDb();
    const group = db.groups.find((g) => g.id === id);
    if (!group) {
      return res.status(404).json({ success: false, error: "Kelompok tidak ditemukan." });
    }
    if ((group.password || "").trim() !== (password || "").trim()) {
      return res.status(401).json({ success: false, error: "Password kelompok salah! Silakan coba lagi." });
    }
    const transactions = db.transactions.filter((t) => t.groupId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const totalMasuk = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalKeluar = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const saldo = totalMasuk - totalKeluar;
    res.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        createdAt: group.createdAt
      },
      stats: {
        saldo,
        totalMasuk,
        totalKeluar,
        transactionCount: transactions.length
      },
      transactions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
function checkAdmin(req, res, next) {
  const pin = req.headers["x-admin-pin"];
  const db = getDb();
  if (!pin || pin.trim() !== db.adminPin.trim()) {
    return res.status(403).json({ success: false, error: "Akses ditolak: PIN Pengelola salah atau belum dimasukkan." });
  }
  next();
}
apiRouter.post("/admin/login", (req, res) => {
  try {
    const { pin } = req.body;
    const db = getDb();
    if ((pin || "").trim() === db.adminPin.trim()) {
      return res.json({ success: true, message: "Login admin berhasil." });
    }
    return res.status(401).json({ success: false, error: "PIN Pengelola salah." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
apiRouter.post("/admin/change-pin", checkAdmin, (req, res) => {
  try {
    const { newPin } = req.body;
    if (!newPin || newPin.trim().length < 4) {
      return res.status(400).json({ success: false, error: "PIN baru minimal 4 karakter." });
    }
    const db = getDb();
    db.adminPin = newPin.trim();
    saveDb(db);
    res.json({ success: true, message: "PIN Pengelola berhasil diubah." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
apiRouter.get("/admin/data", checkAdmin, (req, res) => {
  try {
    const db = getDb();
    const groupsWithStats = db.groups.map((g) => {
      const txs = db.transactions.filter((t) => t.groupId === g.id);
      const totalMasuk = txs.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const totalKeluar = txs.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return {
        ...g,
        saldo: totalMasuk - totalKeluar,
        totalMasuk,
        totalKeluar,
        transactionCount: txs.length
      };
    });
    res.json({
      success: true,
      groups: groupsWithStats,
      transactions: db.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
apiRouter.post("/admin/groups", checkAdmin, (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "Nama kelompok wajib diisi." });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ success: false, error: "Password view kelompok wajib diisi." });
    }
    const db = getDb();
    const id = "kel-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6);
    const newGroup = {
      id,
      name: name.trim(),
      password: password.trim(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.groups.push(newGroup);
    saveDb(db);
    res.json({ success: true, group: newGroup });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
apiRouter.put("/admin/groups/:id", checkAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, password } = req.body;
    const db = getDb();
    const group = db.groups.find((g) => g.id === id);
    if (!group) {
      return res.status(404).json({ success: false, error: "Kelompok tidak ditemukan." });
    }
    if (name && name.trim()) group.name = name.trim();
    if (password && password.trim()) group.password = password.trim();
    saveDb(db);
    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
apiRouter.delete("/admin/groups/:id", checkAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    db.groups = db.groups.filter((g) => g.id !== id);
    db.transactions = db.transactions.filter((t) => t.groupId !== id);
    saveDb(db);
    res.json({ success: true, message: "Kelompok dan transaksi terkait berhasil dihapus." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
apiRouter.post("/admin/transactions", checkAdmin, (req, res) => {
  try {
    const { groupId, date, description, amount, category, imageUrl } = req.body;
    if (!groupId) {
      return res.status(400).json({ success: false, error: "Pilih kelompok terlebih dahulu." });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, error: "Keterangan transaksi wajib diisi." });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount === 0) {
      return res.status(400).json({ success: false, error: "Nominal harus angka valid dan bukan 0." });
    }
    const db = getDb();
    const groupExists = db.groups.some((g) => g.id === groupId);
    if (!groupExists) {
      return res.status(404).json({ success: false, error: "Kelompok tidak ditemukan." });
    }
    const txDate = date && date.trim() ? date.trim() : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const newTx = {
      id: "tx-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6),
      groupId,
      date: txDate,
      description: description.trim(),
      amount: numAmount,
      category: category && category.trim() ? category.trim() : void 0,
      imageUrl: imageUrl || void 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.transactions.push(newTx);
    saveDb(db);
    res.json({ success: true, transaction: newTx });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
apiRouter.put("/admin/transactions/:id", checkAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { date, description, amount, category, imageUrl, groupId } = req.body;
    const db = getDb();
    const tx = db.transactions.find((t) => t.id === id);
    if (!tx) {
      return res.status(404).json({ success: false, error: "Transaksi tidak ditemukan." });
    }
    if (date) tx.date = date;
    if (description && description.trim()) tx.description = description.trim();
    if (amount !== void 0 && !isNaN(Number(amount)) && Number(amount) !== 0) {
      tx.amount = Number(amount);
    }
    if (category !== void 0) {
      tx.category = category && category.trim() ? category.trim() : void 0;
    }
    if (imageUrl !== void 0) tx.imageUrl = imageUrl;
    if (groupId) tx.groupId = groupId;
    saveDb(db);
    res.json({ success: true, transaction: tx });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
apiRouter.delete("/admin/transactions/:id", checkAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const initialLen = db.transactions.length;
    db.transactions = db.transactions.filter((t) => t.id !== id);
    if (db.transactions.length === initialLen) {
      return res.status(404).json({ success: false, error: "Transaksi tidak ditemukan." });
    }
    saveDb(db);
    res.json({ success: true, message: "Transaksi berhasil dihapus." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// server.ts
var app = express();
var PORT = 3e3;
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use("/api", apiRouter);
var distPath = path2.resolve(process.cwd(), "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path2.join(distPath, "index.html"));
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
