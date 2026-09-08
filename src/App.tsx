import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Share2,
  RefreshCw,
  Eye,
  PlusCircle,
  Lock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { Group, Transaction, GroupStats } from './types.ts';
import { api, getStoredAdminPin, setStoredAdminPin, clearStoredAdminPin } from './services/api.ts';
import { Navbar } from './components/Navbar.tsx';
import { HamburgerMenu, PageName } from './components/HamburgerMenu.tsx';
import { SaldoSummaryCards } from './components/SaldoSummaryCards.tsx';
import { TransactionInputForm } from './components/TransactionInputForm.tsx';
import { TransactionList } from './components/TransactionList.tsx';
import { RecentTransactions } from './components/RecentTransactions.tsx';
import { PublicPasswordModal } from './components/PublicPasswordModal.tsx';
import { AdminPinModal } from './components/AdminPinModal.tsx';
import { GroupManagementModal } from './components/GroupManagementModal.tsx';
import { ShareGroupModal } from './components/ShareGroupModal.tsx';
import { ImageLightboxModal } from './components/ImageLightboxModal.tsx';
import { EditTransactionModal } from './components/EditTransactionModal.tsx';
import { PublicGroupPicker } from './components/PublicGroupPicker.tsx';

export default function App() {
  // Global State
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Page Navigation (admin only)
  const [currentPage, setCurrentPage] = useState<PageName>('beranda');

  // Groups and Data
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [publicStats, setPublicStats] = useState<GroupStats | null>(null);

  // Public View Password Unlock State
  const [groupToUnlock, setGroupToUnlock] = useState<Group | null>(null);
  const [isUnlockedForMember, setIsUnlockedForMember] = useState<boolean>(false);

  // Modals
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [isGroupManagementOpen, setIsGroupManagementOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Hamburger menu state
  const [isHamburgerOpen, setIsHamburgerOpen] = useState<boolean>(false);

  const showToast = (message: string, isError = false) => {
    if (isError) {
      setErrorToast(message);
      setTimeout(() => setErrorToast(null), 4000);
    } else {
      setSuccessToast(message);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // Helper to get group ID from URL query ?group=xyz
  const getUrlGroupId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('group');
  };

  // Load Admin Data
  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAdminData();
      setGroups(data.groups);
      setIsAdmin(true);

      const urlGroupId = getUrlGroupId();
      let target = data.groups.find((g) => g.id === urlGroupId);
      if (!target && data.groups.length > 0) {
        target = activeGroup ? data.groups.find((g) => g.id === activeGroup.id) || data.groups[0] : data.groups[0];
      }
      setActiveGroup(target || null);
      setTransactions(data.transactions);
    } catch (err: any) {
      console.warn('Not logged in as admin or error:', err.message);
      setIsAdmin(false);
      clearStoredAdminPin();
      loadPublicData();
    } finally {
      setLoading(false);
    }
  }, [activeGroup]);

  // Load Public Data
  const loadPublicData = useCallback(async () => {
    try {
      setLoading(true);
      const publicGroups = await api.getPublicGroups();
      setGroups(publicGroups);

      const urlGroupId = getUrlGroupId();
      if (urlGroupId) {
        const found = publicGroups.find((g) => g.id === urlGroupId);
        if (found) {
          // Check if already unlocked in sessionStorage
          const savedPass = sessionStorage.getItem(`kas_pass_${found.id}`);
          if (savedPass) {
            try {
              const res = await api.unlockGroup(found.id, savedPass);
              setActiveGroup(res.group);
              setPublicStats(res.stats);
              setTransactions(res.transactions);
              setIsUnlockedForMember(true);
              setGroupToUnlock(null);
            } catch {
              sessionStorage.removeItem(`kas_pass_${found.id}`);
              setGroupToUnlock(found);
              setIsUnlockedForMember(false);
            }
          } else {
            setGroupToUnlock(found);
            setIsUnlockedForMember(false);
          }
        }
      }
    } catch (err: any) {
      showToast('Gagal memuat data kelompok: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const savedAdminPin = getStoredAdminPin();
    if (savedAdminPin) {
      loadAdminData();
    } else {
      loadPublicData();
    }
  }, []);

  // Handle Admin Login
  const handleAdminLogin = async (pin: string) => {
    const success = await api.verifyAdminPin(pin);
    if (!success) {
      throw new Error('PIN Pengelola salah.');
    }
    setStoredAdminPin(pin);
    setIsAdmin(true);
    setIsUnlockedForMember(false);
    setGroupToUnlock(null);
    showToast('Berhasil masuk sebagai Pengelola Kas.');
    await loadAdminData();
  };

  // Handle Admin Logout
  const handleAdminLogout = () => {
    clearStoredAdminPin();
    setIsAdmin(false);
    setActiveGroup(null);
    setTransactions([]);
    setIsUnlockedForMember(false);
    setCurrentPage('beranda');
    showToast('Anda telah keluar dari Mode Pengelola.');
    loadPublicData();
  };

  // Handle Changing Admin PIN
  const handleChangeAdminPin = async (newPin: string) => {
    await api.changeAdminPin(newPin);
    showToast('PIN Pengelola berhasil diubah.');
  };

  // Handle Public Group Password Unlock
  const handleUnlockGroup = async (password: string) => {
    if (!groupToUnlock) return;
    const res = await api.unlockGroup(groupToUnlock.id, password);
    sessionStorage.setItem(`kas_pass_${groupToUnlock.id}`, password);
    setActiveGroup(res.group);
    setPublicStats(res.stats);
    setTransactions(res.transactions);
    setIsUnlockedForMember(true);
    setGroupToUnlock(null);
    showToast(`Laporan kas "${res.group.name}" berhasil dibuka.`);
  };

  // Group Management Actions (Admin)
  const handleCreateGroup = async (name: string, password: string) => {
    const newGroup = await api.createGroup(name, password);
    showToast(`Kelompok "${name}" berhasil dibuat.`);
    await loadAdminData();
    setActiveGroup(newGroup);
  };

  const handleUpdateGroup = async (id: string, name: string, password: string) => {
    await api.updateGroup(id, { name, password });
    showToast('Data kelompok berhasil diperbarui.');
    await loadAdminData();
  };

  const handleDeleteGroup = async (id: string) => {
    await api.deleteGroup(id);
    showToast('Kelompok berhasil dihapus.');
    await loadAdminData();
  };

  // Transaction Actions (Admin)
  const handleAddTransaction = async (data: {
    groupId: string;
    date: string;
    description: string;
    amount: number;
    imageUrl?: string;
  }) => {
    const newTx = await api.addTransaction(data);
    setTransactions((prev) => [newTx, ...prev]);
    showToast(
      data.amount > 0 ? 'Catatan uang masuk tersimpan!' : 'Catatan uang keluar tersimpan!'
    );
    // Reload full admin stats in background
    loadAdminData();
  };

  const handleUpdateTransaction = async (
    id: string,
    data: { date: string; description: string; amount: number; imageUrl?: string }
  ) => {
    const updated = await api.updateTransaction(id, data);
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    showToast('Catatan transaksi berhasil diperbarui.');
    loadAdminData();
  };

  const handleDeleteTransaction = async (txId: string) => {
    await api.deleteTransaction(txId);
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
    showToast('Transaksi berhasil dihapus.');
    loadAdminData();
  };

  // Calculate stats for active group
  const activeTransactions = transactions.filter((t) =>
    activeGroup ? t.groupId === activeGroup.id : false
  );

  const currentStats: GroupStats = isAdmin
    ? {
        totalMasuk: activeTransactions
          .filter((t) => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0),
        totalKeluar: activeTransactions
          .filter((t) => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0),
        saldo:
          activeTransactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) -
          activeTransactions
            .filter((t) => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0),
        transactionCount: activeTransactions.length,
      }
    : publicStats || {
        saldo: 0,
        totalMasuk: 0,
        totalKeluar: 0,
        transactionCount: 0,
      };

  // Lock member view & back to group list
  const handleLockPublicView = () => {
    if (activeGroup) {
      sessionStorage.removeItem(`kas_pass_${activeGroup.id}`);
    }
    setActiveGroup(null);
    setIsUnlockedForMember(false);
    setTransactions([]);
    setPublicStats(null);
    setCurrentPage('beranda');
    // Remove query param cleanly
    window.history.pushState({}, document.title, window.location.pathname);
    loadPublicData();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200">
      {/* Toast Notifications */}
      {successToast && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-700 dark:bg-emerald-600 text-white rounded-xl shadow-lg border border-emerald-600 dark:border-emerald-500 text-xs sm:text-sm animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}
      {errorToast && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-rose-700 dark:bg-rose-600 text-white rounded-xl shadow-lg border border-rose-600 dark:border-rose-500 text-xs sm:text-sm animate-in fade-in slide-in-from-top-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-200" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Hamburger Menu Drawer */}
      <HamburgerMenu
        isOpen={isHamburgerOpen}
        onClose={() => setIsHamburgerOpen(false)}
        isAdmin={isAdmin}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onOpenAdminLogin={() => {
          setIsChangingPin(false);
          setIsAdminLoginOpen(true);
        }}
        onLogoutAdmin={handleAdminLogout}
        onOpenGroupManagement={() => setIsGroupManagementOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Navigation Bar */}
      <Navbar
        isAdmin={isAdmin}
        activeGroup={activeGroup}
        groups={groups}
        currentPage={currentPage}
        onSelectGroup={(g) => {
          setActiveGroup(g);
          // sync query param
          window.history.pushState({}, document.title, `?group=${g.id}`);
        }}
        onNavigate={setCurrentPage}
        onOpenAdminLogin={() => {
          setIsChangingPin(false);
          setIsAdminLoginOpen(true);
        }}
        onLogoutAdmin={handleAdminLogout}
        onOpenGroupManagement={() => setIsGroupManagementOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onChangePin={() => {
          setIsChangingPin(true);
          setIsAdminLoginOpen(true);
        }}
        onOpenHamburgerMenu={() => setIsHamburgerOpen(true)}
        onLockPublicView={isUnlockedForMember ? handleLockPublicView : undefined}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Memuat data kas kelompok...
            </p>
          </div>
        ) : !isAdmin && !isUnlockedForMember && !groupToUnlock ? (
          /* Portal Group Picker (when visitor arrives with no group unlocked) */
          <PublicGroupPicker
            groups={groups}
            onSelectGroupToUnlock={(group) => setGroupToUnlock(group)}
            onOpenAdminLogin={() => {
              setIsChangingPin(false);
              setIsAdminLoginOpen(true);
            }}
          />
        ) : activeGroup ? (
          /* Active Group Dashboard (Admin or Member View Only) */
          <div className="space-y-6">
            {/* View Only Notification Banner for Public Members */}
            {!isAdmin && isUnlockedForMember && (
              <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center justify-between gap-3 text-blue-900 dark:text-blue-200">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                  <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>
                    Anda sedang melihat kas <strong>{activeGroup.name}</strong> dalam{' '}
                    <strong>Mode Lihat Saja (View Only)</strong>.
                  </span>
                </div>
                <button
                  onClick={handleLockPublicView}
                  className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline shrink-0 cursor-pointer"
                >
                  Kunci / Ganti Kelompok
                </button>
              </div>
            )}

            {/* ============================== */}
            {/* ADMIN: Conditional Page Views   */}
            {/* ============================== */}
            {isAdmin ? (
              currentPage === 'beranda' ? (
                /* --- BERANDA (Dashboard) --- */
                <div className="space-y-6">
                  <SaldoSummaryCards
                    saldo={currentStats.saldo}
                    totalMasuk={currentStats.totalMasuk}
                    totalKeluar={currentStats.totalKeluar}
                    transactionCount={currentStats.transactionCount}
                    groupName={activeGroup.name}
                  />

                  {/* Recent Transactions Preview */}
                  <RecentTransactions
                    transactions={activeTransactions}
                    onNavigate={setCurrentPage}
                  />

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setCurrentPage('input')}
                      className="flex items-center justify-center gap-2.5 px-5 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xs transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span className="text-sm font-bold">Input Transaksi</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage('riwayat')}
                      className="flex items-center justify-center gap-2.5 px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl shadow-xs transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span className="text-sm font-bold">Lihat Riwayat</span>
                    </button>
                  </div>
                </div>
              ) : currentPage === 'input' ? (
                /* --- INPUT TRANSAKSI --- */
                <div className="space-y-4">
                  <button
                    onClick={() => setCurrentPage('beranda')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali ke Beranda</span>
                  </button>
                  <TransactionInputForm
                    groupId={activeGroup.id}
                    groupName={activeGroup.name}
                    onAddTransaction={handleAddTransaction}
                  />
                </div>
              ) : currentPage === 'riwayat' ? (
                /* --- RIWAYAT TRANSAKSI --- */
                <div className="space-y-4">
                  <button
                    onClick={() => setCurrentPage('beranda')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali ke Beranda</span>
                  </button>
                  <TransactionList
                    transactions={activeTransactions}
                    isAdmin={isAdmin}
                    groupName={activeGroup.name}
                    onViewImage={(url, title) => setLightboxImage({ url, title })}
                    onEditTransaction={(tx) => setEditingTransaction(tx)}
                    onDeleteTransaction={handleDeleteTransaction}
                  />
                </div>
              ) : null
            ) : (
              /* ============================== */
              /* PUBLIC / MEMBER: View-Only       */
              /* ============================== */
              <div className="space-y-6">
                <SaldoSummaryCards
                  saldo={currentStats.saldo}
                  totalMasuk={currentStats.totalMasuk}
                  totalKeluar={currentStats.totalKeluar}
                  transactionCount={currentStats.transactionCount}
                  groupName={activeGroup.name}
                />
                <TransactionList
                  transactions={activeTransactions}
                  isAdmin={isAdmin}
                  groupName={activeGroup.name}
                  onViewImage={(url, title) => setLightboxImage({ url, title })}
                />
              </div>
            )}
          </div>
        ) : (
          /* Empty or No active group in Admin mode */
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Belum Ada Kelompok Terpilih
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Silakan buat kelompok kas baru untuk mulai mencatat keuangan kas.
              </p>
            </div>
            <button
              onClick={() => setIsGroupManagementOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Kelola & Buat Kelompok</span>
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      {/* 1. Public Password Unlock Modal (Password kelompok tanpa username) */}
      {groupToUnlock && (
        <PublicPasswordModal
          isOpen={!!groupToUnlock}
          group={groupToUnlock}
          onUnlock={handleUnlockGroup}
          onBackToGroupList={() => setGroupToUnlock(null)}
        />
      )}

      {/* 2. Admin PIN Login & Change PIN Modal */}
      <AdminPinModal
        isOpen={isAdminLoginOpen}
        isChangingPin={isChangingPin}
        onClose={() => setIsAdminLoginOpen(false)}
        onLogin={handleAdminLogin}
        onChangePin={handleChangeAdminPin}
      />

      {/* 3. Group Management Modal (Admin) */}
      <GroupManagementModal
        isOpen={isGroupManagementOpen}
        onClose={() => setIsGroupManagementOpen(false)}
        groups={groups}
        onCreateGroup={handleCreateGroup}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
        onSelectGroup={(g) => {
          setActiveGroup(g);
          window.history.pushState({}, document.title, `?group=${g.id}`);
        }}
      />

      {/* 4. Share Public Link Modal */}
      <ShareGroupModal
        isOpen={isShareModalOpen}
        group={activeGroup}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* 5. Image Lightbox Modal for Receipt / Nota Proof */}
      <ImageLightboxModal
        imageUrl={lightboxImage?.url || null}
        title={lightboxImage?.title}
        onClose={() => setLightboxImage(null)}
      />

      {/* 6. Edit Transaction Modal (Admin) */}
      <EditTransactionModal
        isOpen={!!editingTransaction}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={handleUpdateTransaction}
      />
    </div>
  );
}
