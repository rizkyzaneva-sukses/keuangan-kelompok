import React, { useState } from 'react';
import { Share2, Copy, Check, Lock, X, MessageSquare } from 'lucide-react';
import { Group } from '../types.ts';

interface ShareGroupModalProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareGroupModal: React.FC<ShareGroupModalProps> = ({
  group,
  isOpen,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen || !group) return null;

  const publicUrl = `${window.location.origin}${window.location.pathname}?group=${group.id}`;

  const shareText = `Halo anggota kelompok *${group.name}*!\n\nUntuk melihat rincian saldo dan laporan keuangan kas kita (Mode Lihat Saja tanpa perlu registrasi/username), silakan buka link berikut:\n🔗 ${publicUrl}\n\n🔑 *Password Kelompok*: ${group.password || '(Hubungi bendahara)'}\n\nTerima kasih!`;

  const copyLinkOnly = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyFullShareText = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 relative space-y-4 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Bagikan Link Publik Kelompok
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Anggota dapat melihat saldo tanpa bisa mengubah transaksi.
            </p>
          </div>
        </div>

        {/* Group details card */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Nama Kelompok:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{group.name}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              Password Kelompok:
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
              {group.password || '-'}
            </span>
          </div>
        </div>

        {/* Public Link Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Link Publik Kas
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-mono focus:outline-none"
            />
            <button
              onClick={copyLinkOnly}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer shrink-0 ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Tersalin' : 'Salin Link'}</span>
            </button>
          </div>
        </div>

        {/* Action: Copy WhatsApp template */}
        <div className="pt-2">
          <button
            onClick={copyFullShareText}
            className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
              copiedText
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs'
            }`}
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4" />
                <span>Format Pesan WhatsApp Tersalin!</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                <span>Salin Format Pesan WhatsApp Lengkap</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
