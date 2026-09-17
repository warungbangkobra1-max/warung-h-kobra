import React, { useState } from 'react';
import {
  Flame,
  Wifi,
  WifiOff,
  RefreshCw,
  Sun,
  Moon,
  UserCheck,
  Shield,
  Store,
  ChevronDown,
  Bot,
  Sparkles,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { StoreSettings, SyncState, UserRole } from '../types';

interface HeaderProps {
  settings: StoreSettings;
  syncState: SyncState;
  onSync: () => void;
  onToggleTheme: () => void;
  onChangeRole?: (role: UserRole) => void;
  onRoleChange?: (role: UserRole) => void;
  onOpenQuickSale?: () => void;
  onOpenAIBot?: () => void;
  onOpenLogoEditor?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  syncState,
  onSync,
  onToggleTheme,
  onChangeRole,
  onRoleChange,
  onOpenAIBot,
  onOpenLogoEditor,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    if (typeof onChangeRole === 'function') {
      onChangeRole(role);
    }
    if (typeof onRoleChange === 'function') {
      onRoleChange(role);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-950/98 border-b-2 border-stone-800 backdrop-blur-md px-3 sm:px-6 py-2 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Store Name */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div
            id="brand-logo-container"
            onClick={onOpenLogoEditor}
            title={onOpenLogoEditor ? 'Klik untuk Edit / Upload Logo Warung' : settings.storeName}
            className={`w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-950/70 shrink-0 border border-red-500/50 overflow-hidden relative group ${
              onOpenLogoEditor ? 'cursor-pointer' : ''
            }`}
          >
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.storeName}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Flame className="w-5 h-5 text-white animate-pulse group-hover:scale-110 transition-transform" />
            )}

            {onOpenLogoEditor && (
              <div className="absolute inset-0 bg-stone-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-4 h-4 text-orange-400" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-black tracking-tight text-sm sm:text-base md:text-lg text-white leading-none">
                {settings.storeName || 'WARUNG BANG KOBRA'}
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-red-600/30 text-red-400 border border-red-600/40">
                POS
              </span>
              {onOpenLogoEditor && (
                <button
                  type="button"
                  onClick={onOpenLogoEditor}
                  title="Ganti / Upload Logo Warung"
                  className="hidden md:flex items-center gap-1 text-[10px] text-orange-400 hover:text-orange-300 font-bold px-2 py-0.5 rounded-lg bg-stone-900 hover:bg-stone-850 border border-stone-800 transition cursor-pointer"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>Logo</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-stone-400 hidden xs:block font-semibold">
              {settings.tagline || 'Modern Warung POS & Order Management'}
            </p>
          </div>
        </div>

        {/* Status, Role, & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* AI Bot Quick Button */}
          {onOpenAIBot && (
            <button
              id="btn-header-ai-bot"
              onClick={onOpenAIBot}
              title="Buka Asisten AI KobraBot"
              className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-stone-900 hover:bg-orange-600 active:scale-95 text-orange-400 hover:text-white border border-stone-800 hover:border-orange-500 transition shadow-sm cursor-pointer"
            >
              <Bot className="w-4 h-4 text-orange-400 group-hover:text-white" />
              <span className="hidden sm:inline">KobraBot</span>
              <Sparkles className="w-3 h-3 text-orange-400 animate-pulse" />
            </button>
          )}

          {/* Sync Pill & Button */}
          <button
            id="btn-sync-google-sheets"
            onClick={onSync}
            disabled={syncState.isSyncing}
            title={
              syncState.error
                ? syncState.error
                : syncState.lastSync
                ? `Terakhir sinkron: ${new Date(syncState.lastSync).toLocaleTimeString('id-ID')}`
                : 'Klik untuk sinkronkan ke Google Sheets'
            }
            className={`min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              syncState.isSyncing
                ? 'bg-amber-950/40 text-amber-300 border-amber-700/50 cursor-wait'
                : syncState.error
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/40'
                : syncState.isOnline && syncState.lastSync
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/40'
                : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800'
            }`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin text-orange-400' : ''}`}
            />
            <span className="hidden md:inline">
              {syncState.isSyncing
                ? 'Menyinkronkan...'
                : syncState.error
                ? 'Mode Offline'
                : syncState.lastSync
                ? 'Sheets Terhubung'
                : 'Sinkron Sheets'}
            </span>
            <span className="md:hidden">
              {syncState.isSyncing ? 'Sync...' : syncState.error ? 'Offline' : 'Sync'}
            </span>
          </button>

          {/* Role Switcher */}
          <div className="relative">
            <button
              id="btn-switch-role"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 transition cursor-pointer"
            >
              {settings.role === 'ADMIN' ? (
                <Shield className="w-4 h-4 text-red-500" />
              ) : (
                <UserCheck className="w-4 h-4 text-orange-400" />
              )}
              <span className="font-extrabold">{settings.role}</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {showRoleMenu && (
              <div
                id="role-dropdown-menu"
                className="absolute right-0 mt-2 w-48 rounded-2xl bg-stone-900 border-2 border-stone-700 shadow-2xl py-2 z-50 text-xs"
              >
                <div className="px-3 py-1 text-[11px] text-stone-400 font-bold border-b border-stone-800">
                  Peran Kasir Bertugas:
                </div>
                <button
                  onClick={() => {
                    handleRoleChange('ADMIN');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full px-3 py-2.5 text-left flex items-center justify-between hover:bg-stone-800 transition cursor-pointer ${
                    settings.role === 'ADMIN' ? 'text-red-400 font-black bg-stone-800/80' : 'text-stone-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-500" /> Admin (Akses Penuh)
                  </span>
                </button>
                <button
                  onClick={() => {
                    handleRoleChange('KASIR');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full px-3 py-2.5 text-left flex items-center justify-between hover:bg-stone-800 transition cursor-pointer ${
                    settings.role === 'KASIR' ? 'text-orange-400 font-black bg-stone-800/80' : 'text-stone-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-orange-400" /> Kasir (POS & Order)
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            id="btn-toggle-theme"
            onClick={onToggleTheme}
            title={settings.theme === 'dark' ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 transition cursor-pointer"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-orange-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-300" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
