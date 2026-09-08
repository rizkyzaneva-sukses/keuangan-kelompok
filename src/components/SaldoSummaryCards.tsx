import React from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatRupiah } from '../utils/format.ts';

interface SaldoSummaryCardsProps {
  saldo: number;
  totalMasuk: number;
  totalKeluar: number;
  transactionCount: number;
  groupName: string;
}

export const SaldoSummaryCards: React.FC<SaldoSummaryCardsProps> = ({
  saldo,
  totalMasuk,
  totalKeluar,
  transactionCount,
  groupName,
}) => {
  return (
    <div className="space-y-4">
      {/* Primary Saldo Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 rounded-2xl p-5 sm:p-6 text-white shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Saldo Kas Saat Ini
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-['Outfit',sans-serif]">
                {formatRupiah(saldo)}
              </h1>
            </div>
            <p className="text-xs text-slate-300 dark:text-slate-400 mt-1">
              Kas kelompok: <span className="font-semibold text-emerald-400">{groupName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <span className="text-slate-400 block">Total Aktivitas</span>
              <span className="font-bold text-slate-200 text-sm">
                {transactionCount} Catatan Transaksi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Cards: Total Masuk & Total Keluar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Masuk Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Total Uang Masuk
            </span>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-['Outfit',sans-serif]">
              {formatRupiah(totalMasuk)}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Semua nominal positif (+)
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Total Keluar Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              Total Uang Keluar
            </span>
            <p className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 font-['Outfit',sans-serif]">
              {formatRupiah(totalKeluar)}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Semua pengeluaran kas (-)
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-800/80 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};
