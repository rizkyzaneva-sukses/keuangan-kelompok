import React from 'react';
import {
  Wallet,
  ShieldCheck,
  Eye,
  LogOut,
  KeyRound,
  Layers,
  Share2,
  Lock,
  Sun,
  Moon,
  Menu,
  LayoutDashboard,
  PlusCircle,
  List,
} from 'lucide-react';
import { Group } from '../types.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import { PageName } from './HamburgerMenu.tsx';

interface NavbarProps {
  isAdmin: boolean;
  activeGroup?: Group | null;
  groups: Group[];
  currentPage: PageName;
  onSelectGroup: (group: Group) => void;
  onNavigate: (page: PageName) => void;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onOpenGroupManagement: () => void;
  onOpenShareModal: () => void;
  onChangePin: () => void;
  onOpenHamburgerMenu: () => void;
  onLockPublicView?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAdmin,
  activeGroup,
  groups,
  currentPage,
  onSelectGroup,
  onNavigate,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenGroupManagement,
  onOpenShareModal,
  onChangePin,
  onOpenHamburgerMenu,
  onLockPublicView,
}) => {
  const { isDark, toggleTheme } = useTheme();

  const navTabs: { page: PageName; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { page: 'beranda', label: 'Beranda', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { page: 'input', label: 'Input', icon: <PlusCircle className="w-3.5 h-3.5" />, adminOnly: true },
    { page: 'riwayat', label: 'Riwayat', icon: <List className="w-3.5 h-3.5" />, adminOnly: true },
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left section: Hamburger (mobile) + Logo + Desktop Tabs */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Hamburger button — mobile only */}
            {isAdmin && activeGroup && (
              <button
                onClick={onOpenHamburgerMenu}
                className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                aria-label="Buka menu navigasi"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Logo and Brand */}
            <div
              className="flex items-center gap-3 min-w-0 cursor-pointer"
              onClick={() => onNavigate('beranda')}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="min-w-0 hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight truncate">
                    Keuangan Kelompok
                  </span>
                  {isAdmin ? (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck className="w-3 h-3" />
                      Admin Pengelola
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <Eye className="w-3 h-3" />
                      Mode Lihat Saja
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden md:block">
                  {isAdmin
                    ? 'Anda memiliki hak input transaksi dan pengaturan kelompok'
                    : 'Akses publik dengan kata sandi kelompok (tanpa login akun)'}
                </p>
              </div>
            </div>

            {/* Desktop Page Tabs */}
            {isAdmin && activeGroup && (
              <div className="hidden md:flex items-center gap-1 ml-4">
                {navTabs
                  .filter((tab) => !tab.adminOnly || isAdmin)
                  .map((tab) => (
                    <button
                      key={tab.page}
                      onClick={() => onNavigate(tab.page)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        currentPage === tab.page
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Group Switcher (in Admin mode) & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin && groups.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <Layers className="w-4 h-4 text-slate-500 dark:text-slate-400 ml-1.5 hidden sm:inline" />
                <select
                  id="navbar-group-select"
                  aria-label="Pilih Kelompok Kas"
                  className="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1 py-1"
                  value={activeGroup?.id || ''}
                  onChange={(e) => {
                    const found = groups.find((g) => g.id === e.target.value);
                    if (found) onSelectGroup(found);
                  }}
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id} className="dark:bg-slate-800 dark:text-slate-200">
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Share Public Link Button */}
            {activeGroup && (
              <button
                id="btn-share-group"
                onClick={onOpenShareModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Bagikan link publik kelompok ini"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span className="hidden md:inline">Link Publik</span>
              </button>
            )}

            {/* Dark Mode Toggle Button */}
            <button
              id="btn-toggle-theme"
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
              title={isDark ? 'Ganti ke Mode Terang (Light Mode)' : 'Ganti ke Mode Gelap (Dark Mode)'}
              aria-label={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Admin specific action buttons — desktop only */}
            {isAdmin ? (
              <div className="hidden md:flex items-center gap-1.5">
                <button
                  id="btn-manage-groups"
                  onClick={onOpenGroupManagement}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kelola Kelompok</span>
                </button>

                <button
                  id="btn-change-pin"
                  onClick={onChangePin}
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Ubah PIN Admin"
                  aria-label="Ubah PIN Admin"
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                <button
                  id="btn-logout-admin"
                  onClick={onLogoutAdmin}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 border border-rose-200 dark:border-rose-900 rounded-lg transition-colors cursor-pointer"
                  title="Keluar dari mode admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar Admin</span>
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                {activeGroup && onLockPublicView && (
                  <button
                    id="btn-lock-view"
                    onClick={onLockPublicView}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Kunci kembali tampilan kelompok ini"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Kunci / Ganti Kelompok</span>
                  </button>
                )}

                <button
                  id="btn-admin-login"
                  onClick={onOpenAdminLogin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 dark:text-white" />
                  <span>Login Pengelola</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
