import React from 'react';
import {
  X,
  LayoutDashboard,
  PlusCircle,
  List,
  Layers,
  Share2,
  Sun,
  Moon,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';

export type PageName = 'beranda' | 'input' | 'riwayat';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  currentPage: PageName;
  onNavigate: (page: PageName) => void;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onOpenGroupManagement: () => void;
  onOpenShareModal: () => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onClose,
  isAdmin,
  currentPage,
  onNavigate,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenGroupManagement,
  onOpenShareModal,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Slide-in sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <span className="font-bold text-base text-slate-900 dark:text-slate-100">
            Menu Navigasi
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="px-3 py-4 space-y-1">
          {/* Beranda */}
          <button
            onClick={() => {
              onNavigate('beranda');
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 'beranda'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Beranda</span>
          </button>

          {/* Input Transaksi (admin only) */}
          {isAdmin && (
            <button
              onClick={() => {
                onNavigate('input');
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                currentPage === 'input'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Input Transaksi</span>
            </button>
          )}

          {/* Riwayat (admin only) */}
          {isAdmin && (
            <button
              onClick={() => {
                onNavigate('riwayat');
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                currentPage === 'riwayat'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Riwayat</span>
            </button>
          )}

          {/* Divider */}
          <div className="border-t border-slate-200 dark:border-slate-800 my-2" />

          {/* Kelola Kelompok (admin only) */}
          {isAdmin && (
            <button
              onClick={() => {
                onOpenGroupManagement();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Kelola Kelompok</span>
            </button>
          )}

          {/* Link Publik */}
          <button
            onClick={() => {
              onOpenShareModal();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Link Publik</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            <span>{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
          </button>

          {/* Divider */}
          <div className="border-t border-slate-200 dark:border-slate-800 my-2" />

          {/* Admin Auth Actions */}
          {isAdmin ? (
            <button
              onClick={() => {
                onLogoutAdmin();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Admin</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onOpenAdminLogin();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Login Pengelola</span>
            </button>
          )}
        </nav>
      </div>
    </>
  );
};
