export interface CategoryOption {
  id: string;
  name: string;
  type: 'in' | 'out' | 'both';
  color: string;
}

export const INCOME_CATEGORIES: CategoryOption[] = [
  { id: 'iuran', name: 'Iuran Wajib / Rutin', type: 'in', color: 'emerald' },
  { id: 'donasi', name: 'Sumbangan / Donasi', type: 'in', color: 'teal' },
  { id: 'usaha', name: 'Penjualan / Usaha', type: 'in', color: 'cyan' },
  { id: 'pemasukan_lain', name: 'Pemasukan Lainnya', type: 'in', color: 'blue' },
];

export const EXPENSE_CATEGORIES: CategoryOption[] = [
  { id: 'konsumsi', name: 'Konsumsi & Makanan', type: 'out', color: 'amber' },
  { id: 'operasional', name: 'Operasional & ATK', type: 'out', color: 'sky' },
  { id: 'sewa', name: 'Sewa Tempat / Lapangan', type: 'out', color: 'indigo' },
  { id: 'peralatan', name: 'Peralatan & Perlengkapan', type: 'out', color: 'purple' },
  { id: 'kegiatan', name: 'Kegiatan & Acara', type: 'out', color: 'violet' },
  { id: 'transportasi', name: 'Transportasi & Logistik', type: 'out', color: 'orange' },
  { id: 'kebersihan', name: 'Kebersihan & Lingkungan', type: 'out', color: 'green' },
  { id: 'sosial', name: 'Sosial & Santunan', type: 'out', color: 'rose' },
  { id: 'pengeluaran_lain', name: 'Pengeluaran Lainnya', type: 'out', color: 'slate' },
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export function getCategoryBadgeClass(categoryName?: string, isIncome: boolean = true): {
  badgeClass: string;
  dotColor: string;
} {
  if (!categoryName) {
    return isIncome
      ? {
          badgeClass:
            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
          dotColor: 'bg-emerald-500',
        }
      : {
          badgeClass:
            'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
          dotColor: 'bg-rose-500',
        };
  }

  const cat = ALL_CATEGORIES.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase() || c.id === categoryName.toLowerCase()
  );

  const color = cat ? cat.color : isIncome ? 'emerald' : 'rose';

  const colorMap: Record<string, { badgeClass: string; dotColor: string }> = {
    emerald: {
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
      dotColor: 'bg-emerald-500',
    },
    teal: {
      badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800/60',
      dotColor: 'bg-teal-500',
    },
    cyan: {
      badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800/60',
      dotColor: 'bg-cyan-500',
    },
    blue: {
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60',
      dotColor: 'bg-blue-500',
    },
    amber: {
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
      dotColor: 'bg-amber-500',
    },
    sky: {
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60',
      dotColor: 'bg-sky-500',
    },
    indigo: {
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60',
      dotColor: 'bg-indigo-500',
    },
    purple: {
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60',
      dotColor: 'bg-purple-500',
    },
    violet: {
      badgeClass: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800/60',
      dotColor: 'bg-violet-500',
    },
    orange: {
      badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800/60',
      dotColor: 'bg-orange-500',
    },
    green: {
      badgeClass: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800/60',
      dotColor: 'bg-green-500',
    },
    rose: {
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
      dotColor: 'bg-rose-500',
    },
    slate: {
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dotColor: 'bg-slate-400',
    },
  };

  return colorMap[color] || colorMap.slate;
}

/**
 * Auto detects or defaults a category if user didn't select one
 */
export function autoDetectCategory(description: string, isIncome: boolean): string {
  const desc = description.toLowerCase();

  if (isIncome) {
    if (desc.includes('iuran') || desc.includes('rutin') || desc.includes('wajib') || desc.includes('kas')) {
      return 'Iuran Wajib / Rutin';
    }
    if (desc.includes('donasi') || desc.includes('sumbang') || desc.includes('sedekah') || desc.includes('sukarela')) {
      return 'Sumbangan / Donasi';
    }
    if (desc.includes('jual') || desc.includes('bazar') || desc.includes('laba') || desc.includes('usaha')) {
      return 'Penjualan / Usaha';
    }
    return 'Iuran Wajib / Rutin';
  } else {
    if (desc.includes('makan') || desc.includes('snack') || desc.includes('minum') || desc.includes('konsumsi') || desc.includes('kopi') || desc.includes('nasi')) {
      return 'Konsumsi & Makanan';
    }
    if (desc.includes('sewa') || desc.includes('lapangan') || desc.includes('gedung') || desc.includes('ruang') || desc.includes('tenda')) {
      return 'Sewa Tempat / Lapangan';
    }
    if (desc.includes('lampu') || desc.includes('kabel') || desc.includes('alat') || desc.includes('bola') || desc.includes('peralatan') || desc.includes('cat') || desc.includes('speaker') || desc.includes('sound')) {
      return 'Peralatan & Perlengkapan';
    }
    if (desc.includes('acara') || desc.includes('lomba') || desc.includes('peringatan') || desc.includes('agustusan') || desc.includes('turnamen') || desc.includes('kegiatan')) {
      return 'Kegiatan & Acara';
    }
    if (desc.includes('bensin') || desc.includes('transport') || desc.includes('ongkir') || desc.includes('logistik') || desc.includes('antar')) {
      return 'Transportasi & Logistik';
    }
    if (desc.includes('kebersihan') || desc.includes('sampah') || desc.includes('sapu') || desc.includes('keamanan') || desc.includes('ronda')) {
      return 'Kebersihan & Lingkungan';
    }
    if (desc.includes('santunan') || desc.includes('duka') || desc.includes('sakit') || desc.includes('sosial')) {
      return 'Sosial & Santunan';
    }
    if (desc.includes('atk') || desc.includes('kertas') || desc.includes('cetak') || desc.includes('print') || desc.includes('operasional')) {
      return 'Operasional & ATK';
    }
    return 'Pengeluaran Lainnya';
  }
}
