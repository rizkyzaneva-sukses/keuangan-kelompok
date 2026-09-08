import React, { useState } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  FileText,
  Image as ImageIcon,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { Transaction } from '../types.ts';
import { formatRupiah } from '../utils/format.ts';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  autoDetectCategory,
} from '../utils/categories.ts';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    id: string,
    data: {
      date: string;
      description: string;
      amount: number;
      category?: string;
      imageUrl?: string;
    }
  ) => Promise<void>;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !transaction) return null;

  const [date, setDate] = useState(transaction.date);
  const [description, setDescription] = useState(transaction.description);
  const [category, setCategory] = useState(
    transaction.category || autoDetectCategory(transaction.description, transaction.amount > 0)
  );
  const [isNegative, setIsNegative] = useState(transaction.amount < 0);
  const [rawAmount, setRawAmount] = useState(String(Math.abs(transaction.amount)));
  const [imageUrl, setImageUrl] = useState<string | undefined>(transaction.imageUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = rawAmount ? parseInt(rawAmount.replace(/[^0-9]/g, ''), 10) : 0;
  const finalAmount = isNegative ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!description.trim()) {
      setError('Keterangan tidak boleh kosong.');
      return;
    }
    if (!parsedAmount || parsedAmount === 0) {
      setError('Nominal harus lebih besar dari 0.');
      return;
    }

    try {
      setLoading(true);
      await onSave(transaction.id, {
        date,
        description: description.trim(),
        amount: finalAmount,
        category: category.trim() || autoDetectCategory(description.trim(), finalAmount > 0),
        imageUrl,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setLoading(false);
    }
  };

  const relevantCategories = isNegative ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 relative transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-200 dark:border-slate-800">
          Ubah Catatan Transaksi
        </h3>

        {error && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Tanggal */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              Tanggal
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>

          {/* Keterangan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              Keterangan
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>

          {/* Kategori */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {relevantCategories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nominal */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Nominal
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {isNegative ? 'Pengeluaran (-)' : 'Pemasukan (+)'}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setIsNegative(false)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                  !isNegative
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Masuk (+)
              </button>
              <button
                type="button"
                onClick={() => setIsNegative(true)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                  isNegative
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <MinusCircle className="w-3.5 h-3.5" />
                Keluar (-)
              </button>
            </div>

            <input
              type="text"
              value={rawAmount ? Number(rawAmount.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
              onChange={(e) => setRawAmount(e.target.value.replace(/[^0-9]/g, ''))}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>

          {imageUrl && (
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <img src={imageUrl} alt="Bukti" className="w-10 h-10 object-cover rounded-md" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Foto bukti terlampir
                </span>
              </div>
              <button
                type="button"
                onClick={() => setImageUrl(undefined)}
                className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold cursor-pointer"
              >
                Hapus Foto
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
