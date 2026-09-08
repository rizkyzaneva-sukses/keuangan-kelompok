import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  FileText,
  DollarSign,
  Image as ImageIcon,
  Trash2,
  Edit2,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  SlidersHorizontal,
  Tag,
  RotateCcw,
} from 'lucide-react';
import { Transaction } from '../types.ts';
import { formatRupiah, formatDateIndo } from '../utils/format.ts';
import {
  ALL_CATEGORIES,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  getCategoryBadgeClass,
  autoDetectCategory,
} from '../utils/categories.ts';

interface TransactionListProps {
  transactions: Transaction[];
  isAdmin: boolean;
  groupName: string;
  onViewImage: (imageUrl: string, title: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (txId: string) => void;
}

type AmountRangePreset = 'all' | 'custom';

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isAdmin,
  groupName,
  onViewImage,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  
  // Amount Range Filters
  const [amountPreset, setAmountPreset] = useState<AmountRangePreset>('all');
  const [customMinAmount, setCustomMinAmount] = useState<string>('');
  const [customMaxAmount, setCustomMaxAmount] = useState<string>('');
  const [showAmountFilterPanel, setShowAmountFilterPanel] = useState<boolean>(false);

  // Derive categories that actually appear in current transactions or available list
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      const cat = tx.category || autoDetectCategory(tx.description, tx.amount > 0);
      if (cat) set.add(cat);
    });
    // also add standard categories
    ALL_CATEGORIES.forEach((c) => set.add(c.name));
    return Array.from(set);
  }, [transactions]);

  // Determine min and max threshold based on preset or custom inputs
  const { minThreshold, maxThreshold } = useMemo(() => {
    if (amountPreset === 'custom') {
      const min = customMinAmount ? parseInt(customMinAmount.replace(/[^0-9]/g, ''), 10) : 0;
      const max = customMaxAmount ? parseInt(customMaxAmount.replace(/[^0-9]/g, ''), 10) : Infinity;
      return { minThreshold: isNaN(min) ? 0 : min, maxThreshold: isNaN(max) ? Infinity : max };
    }
    return { minThreshold: 0, maxThreshold: Infinity };
  }, [amountPreset, customMinAmount, customMaxAmount]);

  // Check if any filters are currently active
  const isFilterActive = useMemo(() => {
    return (
      searchTerm.trim() !== '' ||
      typeFilter !== 'all' ||
      categoryFilter !== 'all' ||
      amountPreset !== 'all' ||
      customMinAmount !== '' ||
      customMaxAmount !== ''
    );
  }, [searchTerm, typeFilter, categoryFilter, amountPreset, customMinAmount, customMaxAmount]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setAmountPreset('all');
    setCustomMinAmount('');
    setCustomMaxAmount('');
    setShowAmountFilterPanel(false);
  };

  // Filter & sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        const isMasuk = tx.amount > 0;
        const assignedCategory = tx.category || autoDetectCategory(tx.description, isMasuk);
        const absAmount = Math.abs(tx.amount);

        // 1. Search Query Match (description, category name, or nominal)
        const searchLower = searchTerm.toLowerCase().trim();
        const matchesSearch =
          searchLower === '' ||
          tx.description.toLowerCase().includes(searchLower) ||
          assignedCategory.toLowerCase().includes(searchLower) ||
          absAmount.toString().includes(searchLower.replace(/[^0-9]/g, '')) ||
          formatRupiah(tx.amount).toLowerCase().includes(searchLower);

        // 2. Type Match (All, Masuk, Keluar)
        const matchesType =
          typeFilter === 'all'
            ? true
            : typeFilter === 'in'
            ? tx.amount > 0
            : tx.amount < 0;

        // 3. Category Match
        const matchesCategory =
          categoryFilter === 'all' ||
          assignedCategory.toLowerCase() === categoryFilter.toLowerCase();

        // 4. Amount Range Match (compares absolute amount)
        const matchesAmount =
          absAmount >= minThreshold && absAmount <= maxThreshold;

        return matchesSearch && matchesType && matchesCategory && matchesAmount;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === 'amount-desc') {
          return Math.abs(b.amount) - Math.abs(a.amount);
        }
        if (sortBy === 'amount-asc') {
          return Math.abs(a.amount) - Math.abs(b.amount);
        }
        return 0;
      });
  }, [
    transactions,
    searchTerm,
    typeFilter,
    categoryFilter,
    minThreshold,
    maxThreshold,
    sortBy,
  ]);

  // Aggregate stats of filtered transactions
  const filteredSummary = useMemo(() => {
    const totalMasuk = filteredTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalKeluar = filteredTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const net = totalMasuk - totalKeluar;
    return { totalMasuk, totalKeluar, net };
  }, [filteredTransactions]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = ['Tanggal', 'Keterangan', 'Kategori', 'Jenis', 'Nominal (Rp)', 'Ada Bukti'];
    const rows = filteredTransactions.map((t) => {
      const isMasuk = t.amount > 0;
      const cat = t.category || autoDetectCategory(t.description, isMasuk);
      return [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        `"${cat.replace(/"/g, '""')}"`,
        isMasuk ? 'Pemasukan' : 'Pengeluaran',
        t.amount,
        t.imageUrl ? 'Ya' : 'Tidak',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Kas_${groupName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
      {/* Header & Main Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Riwayat Transaksi Kas</span>
              {isFilterActive && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                  Filter Aktif
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan {filteredTransactions.length} dari {transactions.length} catatan
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isFilterActive && (
              <button
                id="btn-reset-filters-top"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 rounded-xl transition cursor-pointer"
                title="Reset semua filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              id="btn-export-csv"
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Unduh CSV</span>
            </button>
          </div>
        </div>

        {/* Primary Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          {/* 1. Search bar */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-tx"
              type="text"
              placeholder="Cari keterangan, kategori, atau nominal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Type filter (Semua, Masuk, Keluar) */}
          <div className="sm:col-span-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('in')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  typeFilter === 'in'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('out')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  typeFilter === 'out'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Keluar
              </button>
            </div>
          </div>

          {/* 3. Category Filter Dropdown */}
          <div className="sm:col-span-2">
            <div className="relative">
              <select
                id="select-category-filter"
                aria-label="Filter Kategori"
                className={`w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/90 border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer truncate transition ${
                  categoryFilter !== 'all'
                    ? 'border-emerald-500 dark:border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Semua Kategori</option>
                <optgroup label="Kategori Pemasukan">
                  {INCOME_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Kategori Pengeluaran">
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* 4. Sort Dropdown */}
          <div className="sm:col-span-2">
            <select
              id="select-sort-order"
              aria-label="Urutkan Transaksi"
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="date-desc">Terbaru</option>
              <option value="date-asc">Terlama</option>
              <option value="amount-desc">Nominal Terbesar</option>
              <option value="amount-asc">Nominal Terkecil</option>
            </select>
          </div>
        </div>

        {/* Amount Range Filter & Quick Presets Toggle */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/70 flex flex-wrap items-center justify-between gap-2">
          {/* Quick Amount Range Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Nominal:
            </span>

            <button
              type="button"
              onClick={() => {
                setAmountPreset('all');
                setCustomMinAmount('');
                setCustomMaxAmount('');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                amountPreset === 'all'
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Semua
            </button>

            <button
              type="button"
              onClick={() => {
                setAmountPreset('custom');
                setShowAmountFilterPanel(!showAmountFilterPanel);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                amountPreset === 'custom'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Kustom Nominal</span>
            </button>
          </div>
        </div>

        {/* Custom Min / Max Amount Inputs Panel (when custom is selected) */}
        {(showAmountFilterPanel || amountPreset === 'custom') && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Rentang Nominal:
            </span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                  Min Rp
                </span>
                <input
                  type="text"
                  placeholder="0"
                  value={
                    customMinAmount
                      ? Number(customMinAmount.replace(/[^0-9]/g, '')).toLocaleString('id-ID')
                      : ''
                  }
                  onChange={(e) => {
                    setAmountPreset('custom');
                    setCustomMinAmount(e.target.value.replace(/[^0-9]/g, ''));
                  }}
                  className="w-32 pl-12 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-xs text-slate-400">-</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                  Maks Rp
                </span>
                <input
                  type="text"
                  placeholder="Tak terbatas"
                  value={
                    customMaxAmount
                      ? Number(customMaxAmount.replace(/[^0-9]/g, '')).toLocaleString('id-ID')
                      : ''
                  }
                  onChange={(e) => {
                    setAmountPreset('custom');
                    setCustomMaxAmount(e.target.value.replace(/[^0-9]/g, ''));
                  }}
                  className="w-36 pl-14 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {(customMinAmount || customMaxAmount) && (
              <button
                type="button"
                onClick={() => {
                  setCustomMinAmount('');
                  setCustomMaxAmount('');
                  setAmountPreset('all');
                }}
                className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Hapus Rentang
              </button>
            )}
          </div>
        )}

        {/* Active Filter Chips & Live Summary Bar */}
        {isFilterActive && (
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/80 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Filter aktif:</span>

              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-xs">
                  Pencarian: &ldquo;{searchTerm}&rdquo;
                  <button
                    onClick={() => setSearchTerm('')}
                    className="hover:text-rose-500 p-0.5"
                    title="Hapus filter teks"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {typeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-xs">
                  Jenis: {typeFilter === 'in' ? 'Uang Masuk' : 'Uang Keluar'}
                  <button
                    onClick={() => setTypeFilter('all')}
                    className="hover:text-rose-500 p-0.5"
                    title="Hapus filter jenis"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {categoryFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                  Kategori: {categoryFilter}
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className="hover:text-rose-500 p-0.5"
                    title="Hapus filter kategori"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {amountPreset !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 text-xs font-semibold">
                  Rentang: {amountPreset === 'custom' ? `${customMinAmount ? formatRupiah(parseInt(customMinAmount, 10)) : '0'} s/d ${customMaxAmount ? formatRupiah(parseInt(customMaxAmount, 10)) : '∞'}` : ''}
                  <button
                    onClick={() => {
                      setAmountPreset('all');
                      setCustomMinAmount('');
                      setCustomMaxAmount('');
                    }}
                    className="hover:text-rose-500 p-0.5"
                    title="Hapus filter rentang"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-600 dark:text-slate-300 font-semibold">
                Ditemukan: {filteredTransactions.length} item
              </span>
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer"
              >
                Reset Semua
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content Table / Cards */}
      {filteredTransactions.length === 0 ? (
        <div className="p-12 text-center text-slate-400 dark:text-slate-500 space-y-3">
          <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 stroke-1" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Tidak ada transaksi yang cocok
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {isFilterActive
              ? 'Tidak ada catatan kas yang cocok dengan kriteria pencarian, kategori, atau rentang nominal saat ini.'
              : isAdmin
              ? 'Mulai masukkan catatan uang masuk atau keluar melalui formulir di atas.'
              : 'Belum ada catatan keuangan yang dimasukkan untuk kelompok ini.'}
          </p>
          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Bersihkan Filter Pencarian</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Bukti Nota</th>
                  {isAdmin && <th className="py-3 px-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.map((tx) => {
                  const isMasuk = tx.amount > 0;
                  const assignedCategory =
                    tx.category || autoDetectCategory(tx.description, isMasuk);
                  const badge = getCategoryBadgeClass(assignedCategory, isMasuk);

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Tanggal */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{formatDateIndo(tx.date)}</span>
                        </div>
                      </td>

                      {/* Keterangan */}
                      <td className="py-3 px-4 text-slate-900 dark:text-slate-100 font-semibold text-sm">
                        <span>{tx.description}</span>
                      </td>

                      {/* Kategori Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
                          <span>{assignedCategory}</span>
                        </span>
                      </td>

                      {/* Nominal */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isMasuk
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
                              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80'
                          }`}
                        >
                          {isMasuk ? (
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          )}
                          {formatRupiah(tx.amount, true)}
                        </span>
                      </td>

                      {/* Bukti Nota */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {tx.imageUrl ? (
                          <button
                            type="button"
                            onClick={() => onViewImage(tx.imageUrl!, tx.description)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg transition cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Lihat Bukti</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {onEditTransaction && (
                              <button
                                type="button"
                                onClick={() => onEditTransaction(tx)}
                                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition cursor-pointer"
                                title="Edit Transaksi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteTransaction && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Yakin ingin menghapus transaksi "${tx.description}"?`)) {
                                    onDeleteTransaction(tx.id);
                                  }
                                }}
                                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.map((tx) => {
              const isMasuk = tx.amount > 0;
              const assignedCategory =
                tx.category || autoDetectCategory(tx.description, isMasuk);
              const badge = getCategoryBadgeClass(assignedCategory, isMasuk);

              return (
                <div
                  key={tx.id}
                  className="p-4 space-y-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateIndo(tx.date)}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.badgeClass}`}
                        >
                          <span className={`w-1 h-1 rounded-full ${badge.dotColor}`} />
                          <span>{assignedCategory}</span>
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1 break-words">
                        {tx.description}
                      </h3>
                    </div>

                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                        isMasuk
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {isMasuk ? (
                        <ArrowDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                      )}
                      {formatRupiah(tx.amount, true)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      {tx.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => onViewImage(tx.imageUrl!, tx.description)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Lihat Bukti Foto</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          Tanpa Bukti Foto
                        </span>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        {onEditTransaction && (
                          <button
                            type="button"
                            onClick={() => onEditTransaction(tx)}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-md"
                            title="Edit transaksi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteTransaction && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus transaksi "${tx.description}"?`)) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-md"
                            title="Hapus transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
