import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  FileText,
  DollarSign,
  Image as ImageIcon,
  PlusCircle,
  MinusCircle,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatRupiah, getTodayDateString } from '../utils/format.ts';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  autoDetectCategory,
} from '../utils/categories.ts';

interface TransactionInputFormProps {
  groupId: string;
  groupName: string;
  onAddTransaction: (data: {
    groupId: string;
    date: string;
    description: string;
    amount: number;
    category?: string;
    imageUrl?: string;
  }) => Promise<void>;
}

export const TransactionInputForm: React.FC<TransactionInputFormProps> = ({
  groupId,
  groupName,
  onAddTransaction,
}) => {
  const [date, setDate] = useState<string>(getTodayDateString());
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [rawAmount, setRawAmount] = useState<string>('');
  const [isNegative, setIsNegative] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFormExpanded, setIsFormExpanded] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  // Auto-suggest category if user hasn't explicitly set one or when description changes
  useEffect(() => {
    if (description.trim()) {
      const detected = autoDetectCategory(description, !isNegative);
      setCategory((prev) => (!prev || prev === 'Lain-lain' ? detected : prev));
    }
  }, [description, isNegative]);

  // Handle amount text changes
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.startsWith('-')) {
      setIsNegative(true);
      setRawAmount(val.replace(/[^0-9]/g, ''));
    } else {
      setRawAmount(val.replace(/[^0-9]/g, ''));
    }
  };

  const parsedAmount = rawAmount ? parseInt(rawAmount, 10) : 0;
  const finalAmount = isNegative ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);

  // Compress & convert uploaded image to data URL
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImagePreview(compressedDataUrl);
          setError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('Keterangan transaksi harus diisi.');
      return;
    }

    if (!parsedAmount || parsedAmount === 0) {
      setError('Nominal harus diisi dan lebih besar dari 0.');
      return;
    }

    const finalCategory =
      category.trim() || autoDetectCategory(description.trim(), finalAmount > 0);

    try {
      setIsSubmitting(true);
      await onAddTransaction({
        groupId,
        date: date || getTodayDateString(),
        description: description.trim(),
        amount: finalAmount,
        category: finalCategory,
        imageUrl: imagePreview || undefined,
      });

      // Reset form
      setDescription('');
      setCategory('');
      setRawAmount('');
      setIsNegative(false);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setSuccessMessage(
        finalAmount > 0
          ? `Uang masuk sebesar ${formatRupiah(finalAmount)} berhasil dicatat!`
          : `Uang keluar sebesar ${formatRupiah(Math.abs(finalAmount))} berhasil dicatat!`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const relevantCategories = isNegative ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div id="transaction-form" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
      {/* Compact header — always visible */}
      <div className="px-5 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
        <div>
          <h2 className="font-bold text-base sm:text-lg flex items-center gap-2">
            <span>Input Transaksi Kas</span>
          </h2>
          <p className="text-xs text-slate-300 dark:text-slate-400 mt-0.5">
            Untuk kelompok: <span className="font-semibold text-emerald-400">{groupName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs px-2.5 py-1 bg-slate-800 dark:bg-slate-900 text-slate-300 rounded-full border border-slate-700">
            Formulir Transaksi
          </span>
          {/* Mobile collapse toggle */}
          <button
            type="button"
            onClick={() => setIsFormExpanded((prev) => !prev)}
            className="md:hidden p-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-slate-300 transition cursor-pointer"
            title={isFormExpanded ? 'Tutup form' : 'Buka form'}
          >
            {isFormExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile collapsed state — minimal info */}
      {!isFormExpanded && (
        <div className="md:hidden px-5 py-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Formulir tersembunyi. Ketuk untuk membuka form input transaksi.</span>
          <button
            type="button"
            onClick={() => setIsFormExpanded(true)}
            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
          >
            Buka
          </button>
        </div>
      )}

      {/* Desktop always shows; mobile shows only when expanded */}
      <div className={`${isFormExpanded ? 'block' : 'hidden'} md:block`}>
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Tanggal */}
            <div className="space-y-1.5">
              <label
                htmlFor="input-date"
                className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  1. Tanggal
                </span>
                <button
                  type="button"
                  onClick={() => setDate(getTodayDateString())}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium cursor-pointer"
                >
                  Reset Hari Ini
                </button>
              </label>
              <div className="relative">
                <input
                  id="input-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition"
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Default hari ini, dapat dipilih tanggal lain.
              </p>
            </div>

            {/* 3. Nominal (Uang Masuk / Keluar) */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  3. Nominal (Masuk/Keluar)
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {isNegative ? 'Minus (-) = Keluar' : 'Plus (+) = Masuk'}
                </span>
              </label>

              {/* Type Switcher Toggles */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  id="btn-toggle-masuk"
                  onClick={() => {
                    setIsNegative(false);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                    !isNegative
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Uang Masuk (+)</span>
                </button>

                <button
                  type="button"
                  id="btn-toggle-keluar"
                  onClick={() => {
                    setIsNegative(true);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                    isNegative
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>Uang Keluar (-)</span>
                </button>
              </div>

              {/* Amount input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span
                    className={`text-sm font-bold ${
                      isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isNegative ? '- Rp' : '+ Rp'}
                  </span>
                </div>
                <input
                  id="input-amount"
                  type="text"
                  inputMode="numeric"
                  placeholder={isNegative ? 'Contoh: 50000' : 'Contoh: 200000'}
                  value={rawAmount ? Number(rawAmount).toLocaleString('id-ID') : ''}
                  onChange={handleAmountChange}
                  required
                  className={`w-full pl-14 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-800 transition ${
                    isNegative
                      ? 'border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 focus:ring-rose-500'
                      : 'border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 focus:ring-emerald-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 2. Keterangan & Kategori Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8 space-y-1.5">
              <label
                htmlFor="input-description"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                2. Keterangan Transaksi
              </label>
              <input
                id="input-description"
                type="text"
                placeholder="Contoh: Iuran bulanan Bpk. Ahmad, Beli snack konsumsi rapat, Sewa lapangan..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition"
              />
            </div>

            <div className="sm:col-span-4 space-y-1.5">
              <label
                htmlFor="select-category-input"
                className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  Kategori
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Otomatis/Pilih</span>
              </label>
              <select
                id="select-category-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Pilih Kategori...</option>
                {relevantCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Bukti (Image) */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                4. Bukti Foto / Nota (Opsional)
              </span>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Hapus Foto
                </button>
              )}
            </label>

            <input
              id="input-file-proof"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!imagePreview ? (
              <div
                id="dropzone-proof"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/40 hover:bg-emerald-50/30 dark:hover:bg-slate-800/80 rounded-xl p-4 sm:p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium">
                  Klik untuk ambil foto / upload nota bukti, atau seret gambar ke sini
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Format: JPG, PNG, WebP (otomatis dioptimalkan)
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl">
                <img
                  src={imagePreview}
                  alt="Pratinjau Bukti"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-300 dark:border-slate-600"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    Foto Bukti Terlampir
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Siap disimpan bersama transaksi kas
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    Ganti Foto
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              id="btn-submit-transaction"
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white shadow-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                isSubmitting
                  ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed'
                  : isNegative
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan Transaksi...</span>
                </>
              ) : isNegative ? (
                <>
                  <MinusCircle className="w-4 h-4" />
                  <span>Catat Pengeluaran ({formatRupiah(Math.abs(finalAmount || 0))})</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Catat Pemasukan ({formatRupiah(Math.abs(finalAmount || 0))})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
