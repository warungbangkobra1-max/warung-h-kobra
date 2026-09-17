import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Package,
  Tags,
  Layers,
  Users,
  Receipt,
  BarChart3,
  UserCheck,
  QrCode,
  Settings as SettingsIcon,
  Menu,
  X,
  Bot,
  Sparkles,
  Flame,
  Image as ImageIcon,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { ActiveTab, UserRole } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab?: (tab: ActiveTab) => void;
  onTabChange?: (tab: ActiveTab) => void;
  role: UserRole;
  lowStockCount: number;
  onOpenLogoEditor?: () => void;
  logoUrl?: string;
  storeName?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onTabChange,
  role,
  lowStockCount,
  onOpenLogoEditor,
  logoUrl,
  storeName,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleSelectTab = (tab: ActiveTab) => {
    if (typeof onSelectTab === 'function') {
      onSelectTab(tab);
    }
    if (typeof onTabChange === 'function') {
      onTabChange(tab);
    }
  };

  // 1. DESKTOP NAVIGATION (Exactly 12 items as specified)
  // Dashboard, Kasir, Pesanan, Produk, Kategori, Stok, Pelanggan, Pengeluaran, Laporan, Pengguna, QR Code, Pengaturan
  const desktopNavItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeText?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Kasir', icon: ShoppingCart },
    { id: 'orders', label: 'Pesanan', icon: ShoppingBag },
    { id: 'products', label: 'Produk', icon: Package },
    { id: 'categories', label: 'Kategori', icon: Tags },
    { id: 'stock', label: 'Stok', icon: Layers, badge: lowStockCount },
    { id: 'customers', label: 'Pelanggan', icon: Users },
    { id: 'expenses', label: 'Pengeluaran', icon: Receipt },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
    { id: 'users', label: 'Pengguna', icon: UserCheck },
    { id: 'qrcode_order', label: 'QR Code', icon: QrCode, badgeText: 'Takeaway' },
    { id: 'settings', label: 'Pengaturan', icon: SettingsIcon },
  ];

  // 2. MOBILE BOTTOM NAVIGATION (Exactly: Home, Kasir, Pesanan, Produk, Menu)
  const mobileBottomItems: Array<{
    id: ActiveTab | 'menu';
    label: string;
    icon: React.ElementType;
    badge?: number;
  }> = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'pos', label: 'Kasir', icon: ShoppingCart },
    { id: 'orders', label: 'Pesanan', icon: ShoppingBag },
    { id: 'products', label: 'Produk', icon: Package },
    { id: 'menu', label: 'Menu', icon: Menu },
  ];

  // 3. MENU LAINNYA DALAM MOBILE DRAWER
  // Kategori, Stok, Pelanggan, Pengeluaran, Laporan, Pengguna, QR Code, Pengaturan (+ Asisten AI)
  const drawerNavItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    desc: string;
    badge?: number;
    badgeText?: string;
  }> = [
    { id: 'categories', label: 'Kategori', icon: Tags, desc: 'Kelompok menu makanan & minuman' },
    { id: 'stock', label: 'Stok', icon: Layers, desc: 'Pantau sisa stok bahan & menu', badge: lowStockCount },
    { id: 'customers', label: 'Pelanggan', icon: Users, desc: 'Daftar langganan & histori' },
    { id: 'expenses', label: 'Pengeluaran', icon: Receipt, desc: 'Catat belanja bahan & operasional' },
    { id: 'reports', label: 'Laporan', icon: BarChart3, desc: 'Omset penjualan & laba rugi' },
    { id: 'users', label: 'Pengguna', icon: UserCheck, desc: 'Kelola kasir & staf warung' },
    { id: 'qrcode_order', label: 'QR Code', icon: QrCode, desc: 'Standee QR Takeaway & Delivery', badgeText: 'Scan' },
    { id: 'settings', label: 'Pengaturan', icon: SettingsIcon, desc: 'Data warung, struk & printer' },
    { id: 'ai_bot', label: 'Asisten AI', icon: Bot, desc: 'Analisis cerdas Warung KobraBot', badgeText: 'AI' },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR NAVIGATION (1366px laptop, 1920px desktop, & tablets landscape) */}
      <aside className="hidden lg:flex flex-col w-64 bg-stone-950 border-r-2 border-stone-800 shrink-0 p-3 space-y-1.5 select-none min-h-[calc(100vh-65px)]">
        <div className="px-3 pt-2 pb-1.5 flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-stone-400">
          <span>Navigasi Warung</span>
          <span className="text-orange-500 font-bold text-[10px]">POS Modern</span>
        </div>

        {desktopNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id ||
            (item.id === 'orders' && activeTab === 'whatsapp_order');

          return (
            <button
              key={item.id}
              id={`nav-desktop-${item.id}`}
              type="button"
              onClick={() => handleSelectTab(item.id)}
              className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-extrabold transition-all cursor-pointer ${
                isActive
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/60 border border-red-500/60 scale-[1.01]'
                  : 'text-stone-300 hover:text-white hover:bg-stone-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-orange-500/80 group-hover:text-orange-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && item.badge > 0 ? (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-orange-500 text-stone-950 shadow-sm animate-pulse">
                  {item.badge}
                </span>
              ) : item.badgeText ? (
                <span
                  className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase ${
                    isActive
                      ? 'bg-black text-orange-400'
                      : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  }`}
                >
                  {item.badgeText}
                </span>
              ) : null}
            </button>
          );
        })}

        {/* Sidebar Footer: Warung Brand & Edit Logo */}
        <div className="mt-auto pt-3 border-t border-stone-800 space-y-2">
          <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-red-600 flex items-center justify-center shrink-0 border border-red-500/40">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo Warung" className="w-full h-full object-cover" />
                ) : (
                  <Flame className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-white truncate">
                  {storeName || 'Warung Modern'}
                </p>
                <p className="text-[10px] text-orange-400 font-semibold">
                  {role === 'ADMIN' ? 'Akses Admin' : 'Akses Kasir'}
                </p>
              </div>
            </div>

            {onOpenLogoEditor && role === 'ADMIN' && (
              <button
                type="button"
                id="btn-sidebar-edit-logo"
                onClick={onOpenLogoEditor}
                className="w-full min-h-[36px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-200 hover:text-orange-400 border border-stone-800 text-xs font-bold transition cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-orange-400" />
                <span>Ubah Logo Warung</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION:
          5 Primary Items: Home, Kasir, Pesanan, Produk, Menu
          Touch-Friendly, Height min 56px, Big Icons, High Contrast */}
      <nav
        id="mobile-bottom-navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/98 border-t-2 border-stone-800 backdrop-blur-xl px-1 py-1.5 flex items-center justify-around shadow-[0_-8px_25px_rgba(0,0,0,0.8)]"
      >
        {mobileBottomItems.map((item) => {
          const Icon = item.icon;
          const isMenuTrigger = item.id === 'menu';
          const isCurrentActive =
            !isMenuTrigger &&
            (activeTab === item.id ||
              (item.id === 'orders' && activeTab === 'whatsapp_order'));

          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              type="button"
              onClick={() => {
                if (isMenuTrigger) {
                  setMobileDrawerOpen(true);
                } else {
                  handleSelectTab(item.id as ActiveTab);
                }
              }}
              className={`flex-1 min-h-[52px] flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer relative select-none active:scale-95 ${
                isCurrentActive
                  ? 'text-white'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {/* Active Highlight Pill */}
              <div
                className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all ${
                  isCurrentActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-900/50'
                    : isMenuTrigger && mobileDrawerOpen
                    ? 'bg-stone-800 text-orange-400'
                    : 'text-stone-400'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.id === 'stock' && lowStockCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full animate-ping" />
                )}
              </div>

              <span
                className={`text-[11px] font-black tracking-tight mt-0.5 truncate max-w-full ${
                  isCurrentActive ? 'text-red-500 font-extrabold' : 'text-stone-400'
                }`}
              >
                {item.label}
              </span>

              {/* Indicator dot */}
              {isCurrentActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute bottom-0.5" />
              )}
            </button>
          );
        })}
      </nav>

      {/* MOBILE DRAWER: "Menu lainnya masuk drawer" */}
      {mobileDrawerOpen && (
        <div
          id="mobile-navigation-drawer-backdrop"
          className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end animate-in fade-in"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            id="mobile-navigation-drawer"
            onClick={(e) => e.stopPropagation()}
            className="bg-stone-900 border-t-2 border-red-600/40 rounded-t-[32px] p-5 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl animate-in slide-in-from-bottom-5"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-red-600 text-white font-black shadow-md shadow-red-900/40">
                  <Menu className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-white text-base">Menu Lainnya</h3>
                  <p className="text-[11px] text-stone-400 font-medium">
                    Modern Warung POS Bang Kobra
                  </p>
                </div>
              </div>

              {/* Big Touch Close Button */}
              <button
                type="button"
                id="btn-close-mobile-drawer"
                onClick={() => setMobileDrawerOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-300 hover:text-white border border-stone-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Items Grid: Big Touch Buttons (min 52px height) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {drawerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`drawer-item-${item.id}`}
                    type="button"
                    onClick={() => {
                      handleSelectTab(item.id);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full min-h-[58px] flex items-center justify-between p-3.5 rounded-2xl text-left border-2 transition-all cursor-pointer active:scale-98 ${
                      isActive
                        ? 'bg-red-600/20 border-red-600 text-white shadow-md'
                        : 'bg-stone-950 hover:bg-stone-800/80 border-stone-800 text-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                            : 'bg-stone-900 text-orange-400 border border-stone-800'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-sm text-white truncate">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-stone-400 truncate">
                          {item.desc}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {item.badge && item.badge > 0 ? (
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-orange-500 text-stone-950 animate-pulse">
                          {item.badge}
                        </span>
                      ) : item.badgeText ? (
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-red-600/30 text-red-400 border border-red-600/40 uppercase">
                          {item.badgeText}
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-stone-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Warung Logo Upload in Drawer */}
            {onOpenLogoEditor && role === 'ADMIN' && (
              <div className="pt-2 border-t border-stone-800">
                <button
                  type="button"
                  id="btn-drawer-edit-logo"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    onOpenLogoEditor();
                  }}
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-2xl bg-stone-950 hover:bg-stone-800 active:scale-95 text-stone-200 border-2 border-stone-800 text-xs font-black transition cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-orange-400" />
                  <span>Edit & Upload Logo Warung</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
