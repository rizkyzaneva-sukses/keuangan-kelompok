import React from 'react';
import { Layers, Lock, ArrowRight, ShieldCheck, Wallet } from 'lucide-react';
import { Group } from '../types.ts';

interface PublicGroupPickerProps {
  groups: Group[];
  onSelectGroupToUnlock: (group: Group) => void;
  onOpenAdminLogin: () => void;
}

export const PublicGroupPicker: React.FC<PublicGroupPickerProps> = ({
  groups,
  onSelectGroupToUnlock,
  onOpenAdminLogin,
}) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Welcome Banner */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
          <Wallet className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-['Outfit',sans-serif]">
          Laporan Keuangan Kas Kelompok
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Pilih kelompok Anda untuk melihat rincian saldo dan transaksi kas secara transparan. Cukup masukkan kata sandi kelompok tanpa perlu akun atau username.
        </p>
      </div>

      {/* Groups Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Daftar Kelompok Kas
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {groups.length} Kelompok Tersedia
          </span>
        </div>

        {groups.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada kelompok</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Pengelola belum membuat kelompok kas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => onSelectGroupToUnlock(group)}
                className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <Lock className="w-3 h-3" />
                      Berpengaman Password
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {group.transactionCount ?? 0} Transaksi
                    </span>
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    {group.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Klik untuk memasukkan password kelompok dan melihat rincian saldo.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                  <span>Buka Laporan Kas</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Callout Card */}
      <div className="p-5 rounded-2xl bg-slate-900 dark:bg-slate-900 border border-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-sm text-slate-100">
              Apakah Anda Bendahara / Pengelola Kas?
            </h4>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Masuk dengan PIN Pengelola untuk menginput transaksi baru (Tanggal, Keterangan, Nominal, Bukti) dan mengelola kelompok.
          </p>
        </div>

        <button
          onClick={onOpenAdminLogin}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition cursor-pointer shrink-0"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Login Pengelola Kas</span>
        </button>
      </div>
    </div>
  );
};
