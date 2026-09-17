import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Download,
  Upload,
  X,
  Check,
  Package,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { Product, ProductCategory } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface ProductsViewProps {
  products: Product[];
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (prod: Product) => void;
  onDeleteProduct: (id: string) => void;
  onImportProducts: (prods: Product[]) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onImportProducts,
  showToast,
}) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Semua');
  const [sortBy, setSortBy] = useState<'nama' | 'harga-asc' | 'harga-desc' | 'stok-asc' | 'stok-desc'>('nama');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    sku: '',
    nama: '',
    kategori: 'Makanan',
    harga_modal: 0,
    harga_jual: 0,
    satuan: 'Porsi',
    stok: 20,
    stok_minimum: 5,
    foto: '',
    status: 'Aktif',
    deskripsi: '',
  });

  const categories: Array<ProductCategory> = ['Makanan', 'Minuman', 'Snack', 'Tambahan', 'Lainnya'];

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchCategory = filterCategory === 'Semua' || p.kategori === filterCategory;
      const matchSearch =
        p.nama.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.deskripsi && p.deskripsi.toLowerCase().includes(search.toLowerCase()));
      return matchCategory && matchSearch;
    });

    return result.sort((a, b) => {
      if (sortBy === 'harga-asc') return a.harga_jual - b.harga_jual;
      if (sortBy === 'harga-desc') return b.harga_jual - a.harga_jual;
      if (sortBy === 'stok-asc') return a.stok - b.stok;
      if (sortBy === 'stok-desc') return b.stok - a.stok;
      return a.nama.localeCompare(b.nama);
    });
  }, [products, search, filterCategory, sortBy]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      sku: 'SKU-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      nama: '',
      kategori: 'Makanan',
      harga_modal: 10000,
      harga_jual: 15000,
      satuan: 'Porsi',
      stok: 25,
      stok_minimum: 5,
      foto: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
      status: 'Aktif',
      deskripsi: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || formData.nama.trim() === '') {
      showToast('Nama produk wajib diisi!', 'error');
      return;
    }

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        ...(formData as Product),
        updated_at: new Date().toISOString(),
      };
      onUpdateProduct(updated);
      showToast(`Produk ${updated.nama} berhasil diperbarui!`, 'success');
    } else {
      const newProd: Product = {
        id: 'PRD-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        sku: formData.sku || 'SKU-' + Date.now().toString().slice(-4),
        nama: formData.nama.trim(),
        kategori: formData.kategori as ProductCategory,
        harga_modal: Number(formData.harga_modal) || 0,
        harga_jual: Number(formData.harga_jual) || 0,
        satuan: formData.satuan || 'Porsi',
        stok: Number(formData.stok) || 0,
        stok_minimum: Number(formData.stok_minimum) || 5,
        foto:
          formData.foto ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
        status: formData.status as 'Aktif' | 'Nonaktif',
        deskripsi: formData.deskripsi || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      onAddProduct(newProd);
      showToast(`Produk ${newProd.nama} berhasil ditambahkan!`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus produk "${nama}"?`)) {
      onDeleteProduct(id);
      showToast(`Produk ${nama} berhasil dihapus.`, 'info');
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `produk_warung_bang_kobra_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Data produk berhasil diekspor!', 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportProducts(parsed);
          showToast(`Berhasil mengimpor ${parsed.length} produk!`, 'success');
        } else {
          showToast('Format file JSON tidak valid (harus array produk).', 'error');
        }
      } catch (err) {
        showToast('Gagal membaca file JSON.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            <span>Manajemen Menu & Produk</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-400">
            Kelola daftar menu, harga jual, harga modal, dan kontrol stok minimum.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800 text-xs font-bold cursor-pointer transition">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800 text-xs font-bold transition"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            id="btn-add-product"
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs shadow-lg shadow-amber-950/30 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk, SKU, atau deskripsi..."
            className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-10 pr-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Category Filter */}
        <div className="sm:col-span-4">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
          >
            <option value="Semua">Semua Kategori ({products.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="sm:col-span-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
          >
            <option value="nama">Urutkan: Nama (A-Z)</option>
            <option value="harga-asc">Harga Terendah</option>
            <option value="harga-desc">Harga Tertinggi</option>
            <option value="stok-asc">Stok Paling Sedikit</option>
            <option value="stok-desc">Stok Paling Banyak</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-950/70 border-b border-stone-800 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              <tr>
                <th className="py-3.5 px-4">Menu</th>
                <th className="py-3.5 px-3">Kategori</th>
                <th className="py-3.5 px-3">Harga Jual</th>
                <th className="py-3.5 px-3">Harga Modal</th>
                <th className="py-3.5 px-3">Stok</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-medium">
              {filteredAndSortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-500">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              ) : (
                filteredAndSortedProducts.map((p) => {
                  const isLow = p.stok <= p.stok_minimum;
                  return (
                    <tr key={p.id} className="hover:bg-stone-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.foto}
                            alt={p.nama}
                            className="w-10 h-10 rounded-xl object-cover bg-stone-950 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-stone-200 truncate">{p.nama}</div>
                            <div className="text-[10px] text-stone-400 font-mono">{p.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-800 text-stone-300">
                          {p.kategori}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">
                        {formatRupiah(p.harga_jual)}
                      </td>
                      <td className="py-3 px-3 font-mono text-stone-400">
                        {formatRupiah(p.harga_modal)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 font-mono">
                          <span className={isLow ? 'text-rose-400 font-bold' : 'text-stone-300'}>
                            {p.stok} {p.satuan}
                          </span>
                          {isLow && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                              STOK MENIPIS
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'Aktif'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-stone-800 text-stone-500'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.nama)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-900/60 text-stone-400 hover:text-rose-300 transition"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/40">
              <h3 className="text-base font-extrabold text-stone-100">
                {editingProduct ? 'Edit Menu / Produk' : 'Tambah Menu Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-300 mb-1 block">Nama Menu *</label>
                  <input
                    type="text"
                    required
                    value={formData.nama || ''}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Mi Aceh Spesial"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 mb-1 block">Kategori</label>
                  <select
                    value={formData.kategori || 'Makanan'}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori: e.target.value as ProductCategory })
                    }
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 mb-1 block">SKU / Kode</label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 mb-1 block">Satuan</label>
                  <input
                    type="text"
                    value={formData.satuan || 'Porsi'}
                    onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                    placeholder="Porsi, Cup, Pcs, Bks"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 mb-1 block">
                    Harga Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.harga_jual ?? ''}
                    onChange={(e) =>
                      setFormData({ ...formData, harga_jual: Number(e.target.value) })
                    }
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 mb-1 block">
                    Harga Modal (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.harga_modal ?? ''}
                    onChange={(e) =>
                      setFormData({ ...formData, harga_modal: Number(e.target.value) })
                    }
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 mb-1 block">Jumlah Stok</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stok ?? ''}
                    onChange={(e) => setFormData({ ...formData, stok: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 mb-1 block">
                    Batas Stok Minimum
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stok_minimum ?? ''}
                    onChange={(e) =>
                      setFormData({ ...formData, stok_minimum: Number(e.target.value) })
                    }
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 mb-1 block">
                  URL Foto Produk
                </label>
                <input
                  type="url"
                  value={formData.foto || ''}
                  onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 mb-1 block">
                  Status Keaktifan
                </label>
                <select
                  value={formData.status || 'Aktif'}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'Aktif' | 'Nonaktif' })
                  }
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Aktif">Aktif (Tampil di Kasir)</option>
                  <option value="Nonaktif">Nonaktif (Disembunyikan)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 mb-1 block">Deskripsi Menu</label>
                <textarea
                  rows={2}
                  value={formData.deskripsi || ''}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Penjelasan bahan, rasa, porsi..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-lg shadow-amber-950/40"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
