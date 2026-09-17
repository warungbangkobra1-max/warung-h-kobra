import React, { useState } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  Plus,
  Key,
  Edit2,
  Trash2,
  Lock,
  Phone,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShoppingBag,
  Clock,
  Coins,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import { WarungUser, UserRole, StoreSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { formatRupiah } from '../../utils/formatters';

interface UsersManagementViewProps {
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  settings,
  onUpdateSettings,
  showToast,
}) => {
  const [users, setUsers] = useState<WarungUser[]>(() => StorageService.getUsers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<WarungUser | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('KASIR');
  const [formPin, setFormPin] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');

  // Quick switch active cashier
  const handleSetActiveCashier = (user: WarungUser) => {
    if (user.status !== 'Aktif') {
      showToast(`User ${user.nama} sedang nonaktif`, 'error');
      return;
    }
    const updated = {
      ...settings,
      activeCashier: user.nama,
      role: user.role,
    };
    onUpdateSettings(updated);
    showToast(`Kasir aktif berhasil diubah ke ${user.nama} (${user.role})`, 'success');
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormUsername('');
    setFormRole('KASIR');
    setFormPin('');
    setFormPhone('');
    setFormStatus('Aktif');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: WarungUser) => {
    setEditingUser(user);
    setFormName(user.nama);
    setFormUsername(user.username);
    setFormRole(user.role);
    setFormPin(user.pin);
    setFormPhone(user.no_hp || '');
    setFormStatus(user.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPin.trim()) {
      showToast('Nama kasir dan PIN wajib diisi!', 'error');
      return;
    }

    if (editingUser) {
      const updated: WarungUser = {
        ...editingUser,
        nama: formName.trim(),
        username: formUsername.trim() || formName.toLowerCase().replace(/\s+/g, ''),
        role: formRole,
        pin: formPin.trim(),
        no_hp: formPhone.trim(),
        status: formStatus,
      };
      const updatedList = StorageService.updateUser(updated);
      setUsers(updatedList);
      showToast(`Pengguna "${formName}" berhasil diperbarui`, 'success');
    } else {
      const newUser: WarungUser = {
        id: `USR-${Date.now()}`,
        nama: formName.trim(),
        username: formUsername.trim() || formName.toLowerCase().replace(/\s+/g, ''),
        role: formRole,
        pin: formPin.trim(),
        no_hp: formPhone.trim(),
        status: formStatus,
        total_transaksi: 0,
        total_omset: 0,
        terakhir_aktif: 'Baru dibuat',
      };
      const updatedList = StorageService.addUser(newUser);
      setUsers(updatedList);
      showToast(`Pengguna baru "${formName}" berhasil ditambahkan`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (user: WarungUser) => {
    if (users.length <= 1) {
      showToast('Minimal harus ada satu pengguna aktif di warung!', 'error');
      return;
    }

    if (user.nama === settings.activeCashier) {
      showToast('Pengguna ini sedang login sebagai kasir aktif!', 'error');
      return;
    }

    if (window.confirm(`Hapus pengguna "${user.nama}"?`)) {
      const updated = StorageService.deleteUser(user.id);
      setUsers(updated);
      showToast(`Pengguna "${user.nama}" dihapus`, 'info');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Top Banner Card: Merah, Hitam, Putih, Aksen Oranye */}
      <div className="bg-gradient-to-r from-red-950/70 via-stone-900 to-black border-2 border-red-600/40 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-red-600 text-white font-black shadow-md shadow-red-900/40">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Manajemen Pengguna & Kasir
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-300">
              Kelola akun Admin dan Kasir warung, atur PIN transaksi, pantau shift kasir aktif, serta catat transaksi per staf.
            </p>
          </div>

          {/* Big Touch-Friendly Button */}
          <button
            type="button"
            id="btn-add-user"
            onClick={handleOpenAdd}
            className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/50 transition cursor-pointer border border-red-500/50"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Pengguna</span>
          </button>
        </div>
      </div>

      {/* Active Cashier Status Callout */}
      <div className="bg-stone-900 border-2 border-orange-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-600 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
            {settings.role === 'ADMIN' ? (
              <Shield className="w-6 h-6" />
            ) : (
              <UserCheck className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 font-bold">Kasir Sedang Login:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500/20 text-orange-400 border border-orange-500/40">
                {settings.role}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">
              {settings.activeCashier || 'Bang Kobra (Owner)'}
            </h3>
          </div>
        </div>

        <div className="text-xs text-stone-400">
          Klik tombol <strong className="text-orange-400">"Pilih Kasir Ini"</strong> pada kartu di bawah untuk berganti kasir bertugas.
        </div>
      </div>

      {/* Users Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => {
          const isCurrentActive = settings.activeCashier === user.nama;
          return (
            <div
              key={user.id}
              className={`bg-stone-900 rounded-3xl p-5 border-2 transition-all flex flex-col justify-between space-y-4 shadow-lg ${
                isCurrentActive
                  ? 'border-red-600 bg-stone-900/90 ring-2 ring-red-600/30'
                  : 'border-stone-800 hover:border-stone-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base ${
                        user.role === 'ADMIN'
                          ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                          : 'bg-stone-800 text-orange-400 border border-stone-700'
                      }`}
                    >
                      {user.role === 'ADMIN' ? (
                        <Shield className="w-5 h-5" />
                      ) : (
                        <UserCheck className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm sm:text-base text-white">
                          {user.nama}
                        </h4>
                      </div>
                      <p className="text-xs text-stone-400 font-mono">@{user.username}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                      user.role === 'ADMIN'
                        ? 'bg-red-950/50 text-red-400 border-red-600/40'
                        : 'bg-orange-950/40 text-orange-400 border-orange-500/40'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                {/* User Details Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-stone-950 p-3 rounded-2xl border border-stone-800/80">
                  <div>
                    <span className="text-[10px] text-stone-500 font-bold block">PIN Masuk</span>
                    <span className="font-mono font-black text-stone-200">•••• ({user.pin})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 font-bold block">No. WhatsApp</span>
                    <span className="font-bold text-stone-300 truncate block">
                      {user.no_hp || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 font-bold block">Total Transaksi</span>
                    <span className="font-black text-orange-400">{user.total_transaksi || 0} Trx</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 font-bold block">Status</span>
                    <span
                      className={`font-black ${
                        user.status === 'Aktif' ? 'text-emerald-400' : 'text-stone-500'
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Big & Touch Friendly */}
              <div className="space-y-2 pt-2 border-t border-stone-800">
                {isCurrentActive ? (
                  <div className="w-full min-h-[44px] rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 font-black text-xs flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sedang Digunakan Saat Ini</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetActiveCashier(user)}
                    className="w-full min-h-[44px] rounded-2xl bg-stone-800 hover:bg-orange-600 active:scale-95 text-stone-200 hover:text-white font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-stone-700 hover:border-orange-500 shadow-md"
                  >
                    <UserCheck className="w-4 h-4 text-orange-400" />
                    <span>Pilih Kasir Ini</span>
                  </button>
                )}

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(user)}
                    className="flex-1 min-h-[38px] rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-stone-800 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-stone-400" />
                    <span>Edit Data</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(user)}
                    className="min-h-[38px] px-3 rounded-xl bg-stone-950 hover:bg-red-950/60 text-stone-400 hover:text-red-400 text-xs font-bold flex items-center justify-center border border-stone-800 transition"
                    title="Hapus Pengguna"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-stone-900 border-2 border-red-600/40 rounded-3xl shadow-2xl p-6 space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2 font-black text-lg text-white">
                <Users className="w-5 h-5 text-red-500" />
                <span>{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-300 block">
                  Nama Lengkap Kasir / Staf <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Siti Rahma (Shift Pagi)"
                  className="w-full min-h-[48px] bg-stone-950 border-2 border-stone-700 focus:border-red-600 rounded-2xl px-4 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-300 block">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="kasir1"
                    className="w-full min-h-[44px] bg-stone-950 border-2 border-stone-700 focus:border-red-600 rounded-2xl px-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-300 block">
                    PIN Masuk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value)}
                    placeholder="4-6 digit angka"
                    className="w-full min-h-[44px] bg-stone-950 border-2 border-stone-700 focus:border-red-600 rounded-2xl px-3 text-xs text-white focus:outline-none font-mono tracking-widest"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-300 block">
                  Peran / Akses
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormRole('ADMIN')}
                    className={`min-h-[44px] rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
                      formRole === 'ADMIN'
                        ? 'bg-red-600 text-white border-red-500 shadow-md'
                        : 'bg-stone-950 text-stone-400 border-stone-800'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin (Penuh)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('KASIR')}
                    className={`min-h-[44px] rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
                      formRole === 'KASIR'
                        ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                        : 'bg-stone-950 text-stone-400 border-stone-800'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Kasir POS</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-300 block">
                  Nomor WhatsApp (Opsional)
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full min-h-[44px] bg-stone-950 border-2 border-stone-700 focus:border-red-600 rounded-2xl px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-300 block">Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormStatus('Aktif')}
                    className={`min-h-[40px] rounded-xl border font-bold text-xs flex items-center justify-center gap-2 ${
                      formStatus === 'Aktif'
                        ? 'bg-emerald-600/30 text-emerald-400 border-emerald-500'
                        : 'bg-stone-950 text-stone-400 border-stone-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aktif</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('Nonaktif')}
                    className={`min-h-[40px] rounded-xl border font-bold text-xs flex items-center justify-center gap-2 ${
                      formStatus === 'Nonaktif'
                        ? 'bg-stone-800 text-stone-300 border-stone-700'
                        : 'bg-stone-950 text-stone-400 border-stone-800'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Nonaktif</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[46px] px-5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[46px] px-6 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-black shadow-lg shadow-red-900/50 border border-red-500/50"
                >
                  {editingUser ? 'Simpan Data' : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
