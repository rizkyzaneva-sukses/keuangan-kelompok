import React, { useState } from 'react';
import { ShieldCheck, X, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdminPinModalProps {
  isOpen: boolean;
  isChangingPin?: boolean;
  onClose: () => void;
  onLogin: (pin: string) => Promise<void>;
  onChangePin?: (newPin: string) => Promise<void>;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  isChangingPin = false,
  onClose,
  onLogin,
  onChangePin,
}) => {
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pin.trim()) {
      setError('Masukkan PIN Pengelola.');
      return;
    }

    try {
      setLoading(true);
      await onLogin(pin.trim());
      setPin('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'PIN Pengelola salah.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPin.trim().length < 4) {
      setError('PIN baru minimal 4 karakter.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('Konfirmasi PIN baru tidak cocok.');
      return;
    }

    try {
      setLoading(true);
      if (onChangePin) {
        await onChangePin(newPin.trim());
      }
      setSuccess('PIN Pengelola berhasil diperbarui!');
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 relative transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-emerald-950/60 border dark:border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {isChangingPin ? 'Ubah PIN Pengelola Kas' : 'Login Pengelola Kas (Admin)'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {isChangingPin
              ? 'Tentukan PIN baru untuk menjaga keamanan pencatatan kas Anda.'
              : 'Hanya pengelola yang memiliki wewenang input transaksi dan kelola kelompok.'}
          </p>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {isChangingPin ? (
          <form onSubmit={handleChangePinSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                PIN Baru (Minimal 4 Karakter)
              </label>
              <input
                type="password"
                placeholder="Masukkan PIN baru..."
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                autoFocus
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Konfirmasi PIN Baru
              </label>
              <input
                type="password"
                placeholder="Ulangi PIN baru..."
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan PIN Baru'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                PIN Pengelola
              </label>
              <input
                id="input-admin-pin"
                type="password"
                placeholder="Masukkan PIN Anda..."
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
                <span>
                  PIN Bawaan Awal:{' '}
                  <strong className="text-slate-600 dark:text-slate-300">123456</strong>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Bisa diubah</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="btn-submit-admin-pin"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 shadow-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Masuk...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-emerald-400 dark:text-white" />
                    <span>Buka Mode Pengelola</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
