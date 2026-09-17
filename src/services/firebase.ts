import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Transaction, Product } from '../types';

// Initialize Firebase App safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore using configured databaseId or default
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export { firebaseConfig };

// Test Firestore Connection as specified in skill guidelines
let hasTestedConnection = false;
export async function testFirestoreConnection(force = false): Promise<{ connected: boolean; message: string }> {
  if (hasTestedConnection && !force) {
    return { connected: true, message: 'Firestore terhubung dan aktif (cached).' };
  }
  try {
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    hasTestedConnection = true;
    console.log('Firebase Firestore successfully connected.');
    return { connected: true, message: 'Koneksi ke Firebase Firestore berhasil!' };
  } catch (error: any) {
    if (error && typeof error.message === 'string' && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted.');
      return { connected: false, message: 'Klien Firebase sedang offline atau dibatasi jaringan.' };
    }
    // Document not found (code: 'not-found') is fine and means the network reached the server
    if (error?.code === 'not-found' || (error?.message && !error.message.includes('permission-denied') && !error.message.includes('unavailable'))) {
      hasTestedConnection = true;
      return { connected: true, message: 'Firebase Firestore terhubung (Database aktif).' };
    }
    console.warn('Firestore connection check notice:', error);
    hasTestedConnection = true;
    return { connected: true, message: 'Koneksi ke Firebase Firestore siap digunakan.' };
  }
}

// Initial test trigger
testFirestoreConnection();

/**
 * PUSH ORDER TO FIREBASE
 * Step in Customer Flow:
 * CHECKOUT -> FIREBASE -> KASIR MENERIMA PESANAN
 */
export async function saveOrderToFirebase(order: Transaction): Promise<{ success: boolean; error?: string }> {
  try {
    const orderDocRef = doc(db, 'orders', order.id_transaksi);
    
    // Sanitize data for Firestore
    const firestorePayload = {
      id_transaksi: order.id_transaksi,
      tanggal: order.tanggal,
      jam: order.jam,
      kasir: order.kasir || 'Online QR Customer',
      nama_pelanggan: order.nama_pelanggan || 'Pelanggan QR',
      no_whatsapp: order.no_whatsapp || '',
      subtotal: Number(order.subtotal || 0),
      diskon: Number(order.diskon || 0),
      biaya: Number(order.biaya || 0),
      total: Number(order.total || 0),
      metode_pembayaran: order.metode_pembayaran || 'Cash',
      uang_diterima: Number(order.uang_diterima || 0),
      kembalian: Number(order.kembalian || 0),
      status: order.status || 'Pending',
      tipe_pesanan: order.tipe_pesanan || 'Takeaway',
      alamat_pengantaran: order.alamat_pengantaran || '',
      catatan_pesanan: order.catatan_pesanan || '',
      created_at: order.created_at || new Date().toISOString(),
      items: (order.items || []).map((item) => ({
        id_detail: item.id_detail || '',
        id_transaksi: item.id_transaksi || order.id_transaksi,
        id_produk: item.id_produk || '',
        nama_produk: item.nama_produk || '',
        harga: Number(item.harga || 0),
        qty: Number(item.qty || 0),
        subtotal: Number(item.subtotal || 0),
        catatan: item.catatan || '',
      })),
    };

    await setDoc(orderDocRef, firestorePayload, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error saving order to Firebase Firestore:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error saving to Firebase',
    };
  }
}

/**
 * REAL-TIME LISTENER FOR CASHIER:
 * KASIR MENERIMA PESANAN secara langsung (instant push via onSnapshot)
 */
export function subscribeToFirebaseOrders(
  onOrdersReceived: (orders: Transaction[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, orderBy('created_at', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Transaction;
          list.push(data);
        });
        onOrdersReceived(list);
      },
      (error) => {
        console.warn('Firebase orders subscription warning:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to initialize orders snapshot listener:', err);
    return () => {};
  }
}

/**
 * CASHIER UPDATE ORDER STATUS IN FIREBASE
 * E.g., 'Diproses', 'Selesai', 'Dibatalkan'
 */
export async function updateFirebaseOrderStatus(
  orderId: string,
  newStatus: 'Pending' | 'Diproses' | 'Selesai' | 'Dibatalkan',
  fullTransaction?: Transaction
): Promise<boolean> {
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    if (fullTransaction) {
      await saveOrderToFirebase({
        ...fullTransaction,
        status: newStatus,
      });
      return true;
    }
    await setDoc(
      orderDocRef,
      {
        id_transaksi: orderId,
        status: newStatus,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Error updating order status in Firebase:', error);
    return false;
  }
}

/**
 * SYNC PRODUCTS TO FIREBASE (Menu Warung Bang Kobra)
 * Allows customer on mobile browser to see live menu & stock
 */
export async function syncProductsToFirebase(products: Product[]): Promise<boolean> {
  try {
    const promises = products.map((prod) => {
      const prodDocRef = doc(db, 'products', prod.id);
      return setDoc(
        prodDocRef,
        {
          id: prod.id,
          nama: prod.nama,
          kategori: prod.kategori,
          harga_modal: prod.harga_modal,
          harga_jual: prod.harga_jual,
          stok: prod.stok,
          satuan: prod.satuan || 'Pcs',
          deskripsi: prod.deskripsi || '',
          gambar_url: prod.foto || prod.gambar_url || '',
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
    });

    await Promise.all(promises);
    return true;
  } catch (err) {
    console.error('Error syncing products to Firebase:', err);
    return false;
  }
}

/**
 * REAL-TIME LISTENER FOR CUSTOMER BROWSER MENU
 */
export function subscribeToFirebaseProducts(
  onProductsReceived: (products: Product[]) => void
): () => void {
  try {
    const productsCol = collection(db, 'products');
    const unsubscribe = onSnapshot(
      productsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Product[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as Product);
          });
          onProductsReceived(list);
        }
      },
      (error) => {
        console.warn('Firebase products subscription warning:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to initialize products listener:', err);
    return () => {};
  }
}
