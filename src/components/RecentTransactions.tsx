import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Transaction } from '../types.ts';
import { formatRupiah, formatDateIndo } from '../utils/format.ts';
import { autoDetectCategory, getCategoryBadgeClass } from '../utils/categories.ts';
import { PageName } from './HamburgerMenu.tsx';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onNavigate: (page: PageName) => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onNavigate,
}) => {
  // Get the last 5 transactions sorted by date descending
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  if (recentTransactions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 text-center transition-colors">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Belum ada transaksi tercatat.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
          Transaksi Terbaru
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          5 catatan terakhir
        </p>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {recentTransactions.map((tx) => {
          const isMasuk = tx.amount > 0;
          const category = tx.category || autoDetectCategory(tx.description, isMasuk);
          const badgeClass = getCategoryBadgeClass(category);

          return (
            <div
              key={tx.id}
              className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {tx.description}
                  </p>
                  {category && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${badgeClass}`}
                    >
                      {category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {formatDateIndo(tx.date)}
                </p>
              </div>
              <span
                className={`text-sm font-bold tabular-nums whitespace-nowrap ${
                  isMasuk
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {isMasuk ? '+' : ''}{formatRupiah(tx.amount)}
              </span>
            </div>
          );
        })}
      </div>

      {transactions.length > 5 && (
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => onNavigate('riwayat')}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 rounded-xl transition-colors cursor-pointer"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
