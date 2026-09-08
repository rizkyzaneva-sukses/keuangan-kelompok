import { Group, Transaction, GroupStats } from '../types.ts';

const ADMIN_PIN_KEY = 'kas_admin_pin';

export function getStoredAdminPin(): string | null {
  return localStorage.getItem(ADMIN_PIN_KEY);
}

export function setStoredAdminPin(pin: string): void {
  localStorage.setItem(ADMIN_PIN_KEY, pin);
}

export function clearStoredAdminPin(): void {
  localStorage.removeItem(ADMIN_PIN_KEY);
}

export const api = {
  // Public endpoints
  async getPublicGroups(): Promise<Group[]> {
    const res = await fetch('/api/public/groups');
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal memuat daftar kelompok');
    }
    return data.groups;
  },

  async unlockGroup(groupId: string, password: string): Promise<{
    group: Group;
    stats: GroupStats;
    transactions: Transaction[];
  }> {
    const res = await fetch(`/api/public/groups/${groupId}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Password salah atau kelompok tidak ditemukan');
    }
    return {
      group: data.group,
      stats: data.stats,
      transactions: data.transactions,
    };
  },

  // Admin endpoints
  async verifyAdminPin(pin: string): Promise<boolean> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    return !!data.success;
  },

  async changeAdminPin(newPin: string): Promise<void> {
    const pin = getStoredAdminPin();
    const res = await fetch('/api/admin/change-pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pin || '',
      },
      body: JSON.stringify({ newPin }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal mengubah PIN Pengelola');
    }
    setStoredAdminPin(newPin);
  },

  async getAdminData(): Promise<{ groups: Group[]; transactions: Transaction[] }> {
    const pin = getStoredAdminPin();
    const res = await fetch('/api/admin/data', {
      headers: {
        'x-admin-pin': pin || '',
      },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal memuat data pengelola');
    }
    return {
      groups: data.groups,
      transactions: data.transactions,
    };
  },

  async createGroup(name: string, password: string): Promise<Group> {
    const pin = getStoredAdminPin();
    const res = await fetch('/api/admin/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pin || '',
      },
      body: JSON.stringify({ name, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal membuat kelompok');
    }
    return data.group;
  },

  async updateGroup(groupId: string, payload: { name?: string; password?: string }): Promise<Group> {
    const pin = getStoredAdminPin();
    const res = await fetch(`/api/admin/groups/${groupId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pin || '',
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal memperbarui kelompok');
    }
    return data.group;
  },

  async deleteGroup(groupId: string): Promise<void> {
    const pin = getStoredAdminPin();
    const res = await fetch(`/api/admin/groups/${groupId}`, {
      method: 'DELETE',
      headers: {
        'x-admin-pin': pin || '',
      },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menghapus kelompok');
    }
  },

  async addTransaction(payload: {
    groupId: string;
    date: string;
    description: string;
    amount: number;
    category?: string;
    imageUrl?: string;
  }): Promise<Transaction> {
    const pin = getStoredAdminPin();
    const res = await fetch('/api/admin/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pin || '',
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menyimpan transaksi');
    }
    return data.transaction;
  },

  async updateTransaction(id: string, payload: {
    groupId?: string;
    date?: string;
    description?: string;
    amount?: number;
    category?: string;
    imageUrl?: string;
  }): Promise<Transaction> {
    const pin = getStoredAdminPin();
    const res = await fetch(`/api/admin/transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pin || '',
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal memperbarui transaksi');
    }
    return data.transaction;
  },

  async deleteTransaction(id: string): Promise<void> {
    const pin = getStoredAdminPin();
    const res = await fetch(`/api/admin/transactions/${id}`, {
      method: 'DELETE',
      headers: {
        'x-admin-pin': pin || '',
      },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menghapus transaksi');
    }
  },
};
