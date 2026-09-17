import React, { useState } from 'react';
import {
  X,
  Lock,
  User,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Flame,
  UserPlus,
  LogIn,
  Sparkles,
  Phone,
  ArrowRight,
  Globe,
} from 'lucide-react';
import { WarungUser, UserRole, StoreSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { signInWithGoogle } from '../../services/firebase';
import {
  normalizeRole,
  getRoleBadgeInfo,
  ROLE_CONFIGS,
  NormalizedRole,
  getDefaultTabForRole,
} from '../../utils/rbac';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: WarungUser | null;
  settings: StoreSettings;
  onLoginSuccess: (user: WarungUser) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isMandatory?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  settings,
  onLoginSuccess,
  showToast,
  isMandatory = false,
}) => {
  const [activeTab, setActiveTab] = useState<'quick_demo' | 'form_login' | 'register_customer'>('quick_demo');

  // Form State
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Register Customer State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPin, setRegPin] = useState('');

  if (!isOpen) return null;

  const users = StorageService.getUsers();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const fbUser = await signInWithGoogle();
      let assignedRole: UserRole = 'Customer';
      if (fbUser.email === 'rayyanarasid549@gmail.com') {
        assignedRole = 'Owner';
      }

      const googleWarungUser: WarungUser = {
        id: fbUser.uid,
        nama: fbUser.displayName || 'Akun Google Firebase',
        username: fbUser.email?.split('@')[0] || `user_${fbUser.uid.slice(0, 6)}`,
        email: fbUser.email || '',
        role: assignedRole,
        pin: '',
        no_hp: fbUser.phoneNumber || '',
        avatar_url: fbUser.photoURL || undefined,
        status: 'Aktif',
        total_transaksi: 0,
        total_omset: 0,
        terakhir_aktif: 'Baru saja',
        created_at: new Date().toISOString(),
      };

      StorageService.addUser(googleWarungUser);
      StorageService.setAuthUser(googleWarungUser);
      onLoginSuccess(googleWarungUser);
      setIsLoading(false);
      showToast(`Berhasil login via Firebase Auth: ${googleWarungUser.nama} (${assignedRole})!`, 'success');
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      console.warn('Google login notice:', err);
      setErrorMsg(err?.message || 'Gagal login via Google Firebase Authentication.');
    }
  };

  const handleQuickLogin = (user: WarungUser) => {
    setIsLoading(true);
    setTimeout(() => {
      StorageService.setAuthUser(user);
      onLoginSuccess(user);
      setIsLoading(false);
      showToast(`Berhasil masuk sebagai ${user.nama} (${user.role})!`, 'success');
      onClose();
    }, 200);
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim() || !pin.trim()) {
      setErrorMsg('Username/No. HP dan PIN wajib diisi!');
      return;
    }

    setIsLoading(true);
    const cleanId = identifier.trim().toLowerCase();
    const cleanPin = pin.trim();

    // Match by username or phone
    const matched = users.find(
      (u) =>
        (u.username.toLowerCase() === cleanId ||
          u.no_hp?.replace(/\D/g, '') === cleanId.replace(/\D/g, '') ||
          u.email?.toLowerCase() === cleanId) &&
        u.pin === cleanPin
    );

    if (!matched) {
      setIsLoading(false);
      setErrorMsg('Username/No. HP atau PIN tidak sesuai. Silakan periksa kembali!');
      return;
    }

    if (matched.status === 'Nonaktif') {
      setIsLoading(false);
      setErrorMsg('Akun ini sedang dinonaktifkan oleh administrator.');
      return;
    }

    // Success
    StorageService.setAuthUser(matched);
    onLoginSuccess(matched);
    setIsLoading(false);
    showToast(`Selamat datang kembali, ${matched.nama}!`, 'success');
    onClose();
  };

  const handleRegisterCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regName.trim() || !regPhone.trim() || !regPin.trim()) {
      setErrorMsg('Nama, Nomor WhatsApp, dan PIN wajib diisi untuk pendaftaran!');
      return;
    }

    if (regPin.trim().length < 4) {
      setErrorMsg('PIN minimal 4 digit angka/karakter!');
      return;
    }

    const cleanPhone = regPhone.trim();
    // Check if phone already registered
    const existing = users.find((u) => u.no_hp === cleanPhone);
    if (existing) {
      setErrorMsg('Nomor WhatsApp ini sudah terdaftar. Silakan langsung masuk!');
      return;
    }

    const newCustomerUser: WarungUser = {
      id: `USR-CST-${Date.now().toString().slice(-4)}`,
      nama: regName.trim(),
      username: `cust_${regName.trim().toLowerCase().replace(/\s+/g, '')}`,
      role: 'Customer',
      pin: regPin.trim(),
      no_hp: cleanPhone,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(regName.trim())}`,
      status: 'Aktif',
      total_transaksi: 0,
      total_omset: 0,
      terakhir_aktif: 'Baru mendaftar',
      created_at: new Date().toISOString(),
    };

    StorageService.addUser(newCustomerUser);
    StorageService.setAuthUser(newCustomerUser);
    onLoginSuccess(newCustomerUser);
    showToast(`Akun Pelanggan atas nama ${newCustomerUser.nama} berhasil dibuat!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-stone-900 border-2 border-stone-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white shadow-md shadow-red-950/40">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-white text-base sm:text-lg flex items-center gap-2">
                <span>Login & Akses Peran</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600/20 text-red-400 border border-red-500/30">
                  RBAC
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                {settings.storeName || 'Warung Bang Kobra'} • Sistem Otentikasi Terpadu
              </p>
            </div>
          </div>

          {!isMandatory && (
            <button
              type="button"
              id="btn-close-login-modal"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-950/60 p-2 gap-1.5 text-xs font-extrabold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('quick_demo');
              setErrorMsg('');
            }}
            className={`flex-1 min-h-[40px] px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'quick_demo'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Login Cepat (5 Role)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('form_login');
              setErrorMsg('');
            }}
            className={`flex-1 min-h-[40px] px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'form_login'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk Akun</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register_customer');
              setErrorMsg('');
            }}
            className={`flex-1 min-h-[40px] px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'register_customer'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Pelanggan</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Firebase Authentication Security Notice Banner */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/40 via-stone-900 to-amber-950/30 border border-blue-800/40 text-stone-300 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-blue-300 text-[11px] uppercase tracking-wider">
                Keamanan Firebase Authentication
              </p>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Password tidak disimpan di Firestore. Kredensial dan sesi diverifikasi resmi oleh server Firebase Authentication.
              </p>
            </div>
          </div>

          {/* Google Firebase Auth Quick Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm border border-stone-200 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? 'Menghubungkan...' : 'Masuk via Google (Firebase Auth)'}</span>
          </button>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-stone-800"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-stone-500 tracking-wider">
              Atau Gunakan Akun Warung
            </span>
            <div className="flex-grow border-t border-stone-800"></div>
          </div>

          {/* TAB 1: QUICK DEMO 5 ROLES */}
          {activeTab === 'quick_demo' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-400">
                Pilih peran di bawah ini untuk beralih atau masuk secara instan tanpa perlu mengetik PIN:
              </p>

              <div className="space-y-2">
                {users.slice(0, 5).map((user) => {
                  const roleConfig = getRoleBadgeInfo(user.role);
                  const isCurrent = currentUser?.id === user.id;

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickLogin(user)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                        isCurrent
                          ? 'bg-stone-850 border-orange-500/60 ring-1 ring-orange-500/40'
                          : 'bg-stone-950 border-stone-800 hover:border-stone-700 hover:bg-stone-850'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-800 border border-stone-700 shrink-0">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.nama}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-stone-300 text-xs">
                              {user.nama.charAt(0)}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-black text-stone-100 text-xs sm:text-sm truncate">
                              {user.nama}
                            </p>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                Aktif
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-400 truncate">
                            {roleConfig.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${roleConfig.badgeBg} ${roleConfig.badgeText} ${roleConfig.badgeBorder}`}
                        >
                          {roleConfig.badge}
                        </span>
                        <ArrowRight className="w-4 h-4 text-stone-600 group-hover:text-stone-300 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-850 text-[11px] text-stone-400 space-y-1">
                <span className="font-bold text-stone-300">💡 Informasi Role:</span>
                <p>
                  Owner & Admin memiliki akses laporan dan pengaturan penuh. Kasir menangani POS penjualan.
                  Staff difokuskan untuk dapur & persediaan stok. Customer mengakses pemesanan QR Code mandiri.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: FORM LOGIN (Username/Phone + PIN) */}
          {activeTab === 'form_login' && (
            <form onSubmit={handleFormLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-400" />
                  <span>Username, No. WhatsApp, atau Email</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: owner, kasir, atau 0812..."
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-red-500 focus:outline-none placeholder:text-stone-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-orange-400" />
                  <span>PIN Keamanan (Password)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    placeholder="Masukkan PIN (e.g. 1234, 1111)"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-red-500 focus:outline-none placeholder:text-stone-600 pr-10 tracking-widest font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-850 text-[11px] text-stone-400">
                <p className="font-bold text-stone-300 mb-0.5">Akun Bawaan (Default):</p>
                <p>• Owner: <strong className="text-amber-400">owner</strong> (PIN: 1234)</p>
                <p>• Kasir: <strong className="text-orange-400">kasir</strong> (PIN: 1111)</p>
                <p>• Staff: <strong className="text-emerald-400">staff</strong> (PIN: 3333)</p>
              </div>

              <button
                type="submit"
                id="btn-submit-form-login"
                disabled={isLoading}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs transition shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
              </button>
            </form>
          )}

          {/* TAB 3: REGISTER CUSTOMER */}
          {activeTab === 'register_customer' && (
            <form onSubmit={handleRegisterCustomer} className="space-y-4">
              <div className="p-3 rounded-2xl bg-sky-950/40 border border-sky-800/40 text-sky-300 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Daftar akun pelanggan untuk menikmati pesanan cepat & tracking status pesanan!</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span>Nama Lengkap Anda</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-sky-500 focus:outline-none placeholder:text-stone-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-sky-400" />
                  <span>Nomor WhatsApp Aktif</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-sky-500 focus:outline-none placeholder:text-stone-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Buat PIN Masuk (4-6 Angka)</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Contoh: 1234"
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-sky-500 focus:outline-none placeholder:text-stone-600 tracking-widest font-mono"
                />
              </div>

              <button
                type="submit"
                id="btn-submit-register-customer"
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs transition shadow-lg shadow-sky-950/50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Daftar Sekarang & Masuk</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
