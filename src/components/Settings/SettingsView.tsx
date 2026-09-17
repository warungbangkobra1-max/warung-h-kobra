import React, { useState } from 'react';
import {
  Settings,
  Store,
  FileSpreadsheet,
  RefreshCw,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Save,
  RotateCcw,
  Copy,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { GoogleSheetsSyncService } from '../../services/googleSheetsSync';
import { StorageService } from '../../services/storage';
import { LogoUploader } from './LogoUploader';

interface SettingsViewProps {
  settings: StoreSettings;
  onSaveSettings: (newSettings: StoreSettings) => void;
  onSyncNow: () => void;
  isSyncing: boolean;
  onResetData: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onSyncNow,
  isSyncing,
  onResetData,
  showToast,
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleInputChange = (field: keyof StoreSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    showToast('Pengaturan toko berhasil disimpan!', 'success');
  };

  const handleTestConnection = async () => {
    if (!formData.googleSheetsUrl || !formData.googleSheetsUrl.startsWith('http')) {
      showToast('Masukkan URL Google Apps Script yang valid terlebih dahulu!', 'error');
      return;
    }

    setIsTestingUrl(true);
    setTestResult(null);

    const res = await GoogleSheetsSyncService.testConnection(formData.googleSheetsUrl);
    setIsTestingUrl(false);
    setTestResult(res);

    if (res.success) {
      showToast('Koneksi ke Google Sheets berhasil!', 'success');
      const updated = { ...formData, isGoogleSheetsConnected: true };
      setFormData(updated);
      onSaveSettings(updated);
    } else {
      showToast(res.message, 'error');
    }
  };

  const sampleAppsScriptCode = `// Script google-apps-script.js
// Buka Google Sheets -> Ekstensi -> Apps Script
// Tempel kode dari file google-apps-script.js pada repositori aplikasi ini
// Klik Deploy -> New Deployment -> Pilih Web App -> Akses: Anyone
// Salin URL Web App dan tempelkan di halaman Pengaturan ini.`;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-500" />
            <span>Pengaturan Warung & Database</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-400">
            Kustomisasi profil warung, integrasi Google Sheets, nomor WhatsApp, dan cetak struk.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs shadow-lg shadow-amber-950/30 transition active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Perubahan</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 0: Identitas Visual & Upload Logo Warung */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-stone-100 text-base flex items-center gap-2">
                  <span>Logo & Branding Warung</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Kustom
                  </span>
                </h3>
                <p className="text-[11px] text-stone-400">
                  Unggah logo warung untuk ditampilkan pada header kasir, menu WhatsApp, dan struk cetak
                </p>
              </div>
            </div>
          </div>

          <LogoUploader
            currentLogoUrl={formData.logoUrl || ''}
            storeName={formData.storeName}
            onLogoChange={(newUrl) => handleInputChange('logoUrl', newUrl)}
            showToast={showToast}
          />
        </div>

        {/* Section 1: Profil Toko & WhatsApp */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-800">
            <Store className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-stone-100 text-base">Profil Warung & Kontak</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-stone-300 mb-1 block">
                Nama Usaha / Warung *
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => handleInputChange('storeName', e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-300 mb-1 block">
                Slogan / Deskripsi Singkat
              </label>
              <input
                type="text"
                value={formData.storeSlogan}
                onChange={(e) => handleInputChange('storeSlogan', e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Configurable WhatsApp Number (CRITICAL requirement: NEVER hardcode) */}
            <div>
              <label className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Nomor WhatsApp Warung * (Untuk Terima Order)</span>
              </label>
              <input
                type="tel"
                required
                value={formData.whatsappNumber}
                onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                placeholder="Contoh: 081234567890 atau 628123456789"
                className="w-full bg-stone-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-emerald-400 font-mono font-bold"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Nomor ini digunakan untuk tombol "Pesan via WhatsApp" dari pelanggan & kirim struk.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-300 mb-1 block">
                Nama Kasir Aktif
              </label>
              <input
                type="text"
                value={formData.activeCashier}
                onChange={(e) => handleInputChange('activeCashier', e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-stone-300 mb-1 block">Alamat Warung</label>
              <input
                type="text"
                value={formData.storeAddress}
                onChange={(e) => handleInputChange('storeAddress', e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-stone-300 mb-1 block">
                URL Gambar QRIS Warung (Opsional)
              </label>
              <input
                type="url"
                value={formData.qrisImageUrl || ''}
                onChange={(e) => handleInputChange('qrisImageUrl', e.target.value)}
                placeholder="https://... (jika kosong akan dibuat QRIS otomatis)"
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Integrasi Google Sheets Backend */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-stone-100 text-base">
                Database Cloud: Google Sheets
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Petunjuk Script</span>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-stone-300 mb-1 block">
                Google Apps Script Web App URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.googleSheetsUrl || ''}
                  onChange={(e) => handleInputChange('googleSheetsUrl', e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingUrl}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition disabled:opacity-50"
                >
                  {isTestingUrl ? 'Mengecek...' : 'Tes Koneksi'}
                </button>
              </div>
              <span className="text-[10px] text-stone-400 mt-1 block">
                Google Sheets digunakan untuk sinkronisasi 8 Sheet (PRODUK, KATEGORI, TRANSAKSI,
                DETAIL_TRANSAKSI, PELANGGAN, PENGELUARAN, STOK_LOG, PENGATURAN).
              </span>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-stone-400">
                Terakhir Sinkronisasi:{' '}
                <span className="font-mono text-stone-200">
                  {formData.lastSyncTime || 'Belum pernah'}
                </span>
              </div>

              <button
                type="button"
                onClick={onSyncNow}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Konfigurasi Struk Kasir & Operasional */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-800">
            <Sliders className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-stone-100 text-base">
              Pengaturan Struk Kasir & POS
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-stone-300 mb-1 block">
                Prefix Nomor Invoice
              </label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => handleInputChange('invoicePrefix', e.target.value.toUpperCase())}
                placeholder="WKB"
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono uppercase"
              />
              <span className="text-[10px] text-stone-400">Format: WKB-YYYYMMDD-001</span>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-300 mb-1 block">
                Ukuran Printer Thermal Struk
              </label>
              <select
                value={formData.receiptPaperSize}
                onChange={(e) => handleInputChange('receiptPaperSize', e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              >
                <option value="58mm">58mm (Printer Kasir Mini / Bluetooth Portabel)</option>
                <option value="80mm">80mm (Printer Kasir Lebar Desktop)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-stone-300 mb-1 block">
                Catatan Kaki Struk (Footer Struk)
              </label>
              <input
                type="text"
                value={formData.receiptFooter}
                onChange={(e) => handleInputChange('receiptFooter', e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-2xl bg-stone-950 border border-stone-800">
              <div>
                <div className="font-bold text-xs text-stone-200">
                  Kontrol Stok Ketat (Stock Enforcement)
                </div>
                <div className="text-[11px] text-stone-400">
                  Cegah kasir menjual menu apabila sisa stok telah habis (0).
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.stockControl}
                onChange={(e) => handleInputChange('stockControl', e.target.checked)}
                className="w-5 h-5 accent-amber-500 cursor-pointer rounded"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Cadangan & Reset Data */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="font-extrabold text-stone-100 text-base">Pemeliharaan & Reset Data</h3>
          <p className="text-xs text-stone-400">
            Aplikasi ini menyimpan data secara lokal dan aman di browser Anda (offline-first). Jika
            Anda ingin mengembalikan menu & transaksi contoh ke versi awal, gunakan tombol di bawah.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    'PERINGATAN: Apakah Anda yakin ingin mengembalikan seluruh data ke data awal Warung Bang Kobra?'
                  )
                ) {
                  onResetData();
                  showToast('Data berhasil dikembalikan ke data awal.', 'info');
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-xs font-bold transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset ke Data Demo Awal</span>
            </button>
          </div>
        </div>
      </form>

      {/* Guide Modal: How to Deploy Google Apps Script */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-stone-100 text-base">
                  Panduan Menghubungkan Google Sheets
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 space-y-1">
                <div className="font-bold text-amber-400">Langkah 1: Buka Google Sheets Baru</div>
                <p>
                  Buka sheets.new di browser Anda untuk membuat Google Spreadsheet baru, beri nama
                  misalnya "Database Warung Bang Kobra".
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 space-y-1">
                <div className="font-bold text-amber-400">Langkah 2: Buka Apps Script</div>
                <p>
                  Di menu atas Google Sheets, klik <strong>Ekstensi (Extensions)</strong> &gt;{' '}
                  <strong>Apps Script</strong>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 space-y-1">
                <div className="font-bold text-amber-400">Langkah 3: Tempel Kode Backend</div>
                <p>
                  Hapus isi default di editor, lalu salin seluruh isi dari file{' '}
                  <code className="text-amber-300">google-apps-script.js</code> yang telah kami
                  sediakan di dalam repositori ini.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 space-y-1">
                <div className="font-bold text-amber-400">Langkah 4: Deploy sebagai Web App</div>
                <p>
                  1. Klik tombol biru <strong>Deploy (Terapkan)</strong> &gt;{' '}
                  <strong>New deployment (Penerapan baru)</strong>.<br />
                  2. Pilih jenis gear ⚙️ &gt; <strong>Web app</strong>.<br />
                  3. Isi deskripsi (misal: "API Warung Bang Kobra").<br />
                  4. Execute as (Jalankan sebagai): <strong>Me (email Anda)</strong>.<br />
                  5. Who has access (Siapa yang memiliki akses):{' '}
                  <strong className="text-emerald-400">Anyone (Siapa saja)</strong>.<br />
                  6. Klik Deploy dan salin URL Web App yang berakhiran{' '}
                  <code className="text-amber-300">/exec</code>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 space-y-1">
                <div className="font-bold text-amber-400">
                  Langkah 5: Masukkan URL di Pengaturan
                </div>
                <p>
                  Tempelkan URL Web App tersebut ke kotak input Google Sheets Web App URL di halaman
                  pengaturan ini, lalu klik tombol <strong>Tes Koneksi</strong>. Seluruh 8 lembar
                  sheet akan otomatis dibuat dan disinkronkan!
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
