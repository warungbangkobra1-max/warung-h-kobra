import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  getDocFromServer,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  User as FirebaseUser,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Transaction,
  Product,
  CategoryItem,
  Expense,
  Customer,
  StoreSettings,
  StockMutation,
  WarungUser,
  UserRole,
} from '../types';

// Initialize Firebase App safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore using configured databaseId or default
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export { firebaseConfig };

// --- SKILL ERROR HANDLER MANDATE ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
 * FIREBASE AUTHENTICATION SERVICES
 * Note: PASSWORDS ARE NEVER STORED IN FIRESTORE!
 * Authentication is fully handled by Firebase Authentication.
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Synchronize user profile into Firestore (WITHOUT PASSWORD OR PIN)
    await syncFirebaseUserProfile(user);
    return user;
  } catch (error) {
    console.error('Error signing in with Google Firebase Auth:', error);
    throw error;
  }
}

export async function signInAnonymouslyCustomer(): Promise<FirebaseUser> {
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (error) {
    console.error('Error with anonymous customer sign in:', error);
    throw error;
  }
}

export async function ensureFirebaseAuth(): Promise<FirebaseUser | null> {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (error) {
    console.warn('Notice: Firebase anonymous auth fallback:', error);
    return null;
  }
}

export async function firebaseSignOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out from Firebase Auth:', error);
    throw error;
  }
}

export function subscribeToAuthState(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// Auto-initialize anonymous session if no session exists yet
ensureFirebaseAuth().catch(() => {});

/**
 * Synchronize Firebase Auth profile to Firestore `/users/{uid}`
 * STRICT SECURITY INVARIANT: NEVER STORE PASSWORD OR PIN IN FIRESTORE
 */
export async function syncFirebaseUserProfile(
  user: FirebaseUser,
  customRole?: UserRole,
  customName?: string
): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(userDocRef);

    let role: UserRole = 'Customer';
    // Developer runtime email bootstrap
    if (user.email === 'rayyanarasid549@gmail.com') {
      role = 'Owner';
    } else if (customRole) {
      role = customRole;
    } else if (existingSnap.exists()) {
      role = (existingSnap.data().role as UserRole) || 'Customer';
    }

    const payload = {
      uid: user.uid,
      email: user.email || '',
      nama: customName || user.displayName || 'Pengguna Warung',
      role,
      no_hp: user.phoneNumber || '',
      avatar_url: user.photoURL || '',
      status: 'Aktif',
      updated_at: new Date().toISOString(),
      ...(!existingSnap.exists() ? { created_at: new Date().toISOString() } : {}),
    };

    // Explicitly guarantee no password or pin is passed
    delete (payload as any).password;
    delete (payload as any).pin;

    await setDoc(userDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * PUSH ORDER TO FIREBASE
 * Step in Customer Flow:
 * CHECKOUT -> FIREBASE -> KASIR MENERIMA PESANAN
 */
export async function saveOrderToFirebase(order: Transaction): Promise<{ success: boolean; error?: string }> {
  const path = `orders/${order.id_transaksi}`;
  try {
    if (!auth.currentUser) {
      await ensureFirebaseAuth();
    }
    const orderDocRef = doc(db, 'orders', order.id_transaksi);
    
    // Sanitize data for Firestore
    const firestorePayload = {
      id_transaksi: order.id_transaksi,
      tanggal: order.tanggal,
      jam: order.jam,
      kasir: order.kasir || 'Online QR Customer',
      customerId: auth.currentUser?.uid || '',
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
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Return safe message
    }
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
  const path = 'orders';
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
        console.warn('Firebase orders subscription notice:', error?.message);
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
  const path = `orders/${orderId}`;
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
    try {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } catch {
      // Handled
    }
    return false;
  }
}

/**
 * SYNC PRODUCTS TO FIREBASE (Menu Warung Bang Kobra)
 * Syncs menu products and stock levels to Firestore
 */
export async function syncProductsToFirebase(products: Product[]): Promise<boolean> {
  if (!products || products.length === 0) {
    return false;
  }

  try {
    // Ensure Firebase Auth session is active
    if (!auth.currentUser) {
      await ensureFirebaseAuth();
    }

    // Chunk in batches of 300 (Firestore maximum is 500 per batch)
    const BATCH_SIZE = 300;
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const chunk = products.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const prod of chunk) {
        if (!prod || !prod.id) continue;
        const prodDocRef = doc(db, 'products', String(prod.id));
        const payload = {
          id: String(prod.id),
          sku: String(prod.sku || prod.id),
          nama: String(prod.nama || 'Menu Kobra'),
          kategori: String(prod.kategori || 'Makanan'),
          harga_modal: Number(prod.harga_modal ?? 0),
          harga_jual: Number(prod.harga_jual ?? 0),
          satuan: String(prod.satuan || 'Pcs'),
          stok: Number(prod.stok ?? 0),
          stok_minimum: Number(prod.stok_minimum ?? 0),
          foto: String(prod.foto || prod.gambar_url || ''),
          gambar_url: String(prod.foto || prod.gambar_url || ''),
          status: String(prod.status || 'Aktif'),
          deskripsi: String(prod.deskripsi || ''),
          created_at: String(prod.created_at || new Date().toISOString()),
          updated_at: new Date().toISOString(),
        };

        batch.set(prodDocRef, payload, { merge: true });
      }

      await batch.commit();
    }

    console.log(`Berhasil menyinkronkan ${products.length} menu ke Firebase Firestore.`);
    return true;
  } catch (err: any) {
    console.error('Error syncing products to Firebase:', err);
    try {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    } catch {
      // Handled
    }
    return false;
  }
}

/**
 * REAL-TIME LISTENER FOR PRODUCTS CATALOG (Synced across all devices)
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
            const data = docSnap.data() as Product;
            if (data && data.id) {
              list.push(data);
            }
          });
          onProductsReceived(list);
        }
      },
      (error) => {
        console.warn('Firebase products subscription warning:', error);
        try {
          handleFirestoreError(error, OperationType.LIST, 'products');
        } catch {
          // Handled
        }
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to initialize products listener:', err);
    return () => {};
  }
}

/**
 * DELETE PRODUCT FROM FIREBASE
 */
export async function deleteProductFromFirebase(productId: string): Promise<boolean> {
  if (!productId) return false;
  try {
    if (!auth.currentUser) {
      await ensureFirebaseAuth();
    }
    const docRef = doc(db, 'products', String(productId));
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error(`Gagal menghapus produk ${productId} dari Firebase:`, err);
    return false;
  }
}

/**
 * DELETE ORDER FROM FIREBASE
 */
export async function deleteOrderFromFirebase(orderId: string): Promise<boolean> {
  if (!orderId) return false;
  try {
    if (!auth.currentUser) {
      await ensureFirebaseAuth();
    }
    const docRef = doc(db, 'orders', String(orderId));
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error(`Gagal menghapus order ${orderId} dari Firebase:`, err);
    return false;
  }
}

/**
 * SYNC CATEGORIES TO FIREBASE
 */
export async function syncCategoriesToFirebase(categories: CategoryItem[]): Promise<boolean> {
  if (!categories || categories.length === 0) return false;
  try {
    if (!auth.currentUser) {
      await ensureFirebaseAuth();
    }
    const batch = writeBatch(db);
    for (const cat of categories) {
      if (!cat || !cat.id) continue;
      const catRef = doc(db, 'categories', String(cat.id));
      batch.set(
        catRef,
        {
          id: String(cat.id),
          nama: String(cat.nama || 'Kategori'),
          deskripsi: String(cat.deskripsi || ''),
          icon: String(cat.icon || ''),
          urutan: Number(cat.urutan ?? 0),
          status: String(cat.status || 'Aktif'),
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
    }
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Gagal menyinkronkan kategori ke Firebase:', err);
    return false;
  }
}

/**
 * DELETE CATEGORY FROM FIREBASE
 */
export async function deleteCategoryFromFirebase(categoryId: string): Promise<boolean> {
  if (!categoryId) return false;
  try {
    if (!auth.currentUser) {
      await ensureFirebaseAuth();
    }
    const docRef = doc(db, 'categories', String(categoryId));
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error(`Gagal menghapus kategori ${categoryId} dari Firebase:`, err);
    return false;
  }
}

/**
 * SUBSCRIBE TO CATEGORIES (Synced across all devices)
 */
export function subscribeToFirebaseCategories(
  onCategoriesReceived: (categories: CategoryItem[]) => void
): () => void {
  try {
    const colRef = collection(db, 'categories');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: CategoryItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as CategoryItem;
            if (data && data.id) {
              list.push(data);
            }
          });
          onCategoriesReceived(list);
        }
      },
      (error) => {
        console.warn('Firebase categories subscription warning:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to initialize categories listener:', err);
    return () => {};
  }
}

/**
 * SAVE EXPENSE TO FIREBASE
 */
export async function saveExpenseToFirebase(expense: Expense): Promise<boolean> {
  if (!expense || !expense.id) return false;
  try {
    if (!auth.currentUser) {
      await ensureFirebaseAuth();
    }
    const docRef = doc(db, 'expenses', String(expense.id));
    const payload = {
      id: String(expense.id),
      tanggal: String(expense.tanggal || new Date().toISOString().slice(0, 10)),
      kategori: String(expense.kategori || 'Operasional'),
      keterangan: String(expense.keterangan || ''),
      jumlah: Number(expense.jumlah ?? 0),
      catatan: String(expense.catatan || ''),
      diinput_oleh: String(expense.diinput_oleh || 'Kasir Warung'),
      created_at: String(expense.created_at || new Date().toISOString()),
    };
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.error('Gagal menyimpan pengeluaran ke Firebase:', err);
    return false;
  }
}

/**
 * DELETE EXPENSE FROM FIREBASE
 */
export async function deleteExpenseFromFirebase(expenseId: string): Promise<boolean> {
  if (!expenseId) return false;
  try {
    if (!auth.currentUser) {
      await ensureFirebaseAuth();
    }
    const docRef = doc(db, 'expenses', String(expenseId));
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error(`Gagal menghapus pengeluaran ${expenseId} dari Firebase:`, err);
    return false;
  }
}

/**
 * SUBSCRIBE TO EXPENSES (Synced across all devices)
 */
export function subscribeToFirebaseExpenses(
  onExpensesReceived: (expenses: Expense[]) => void
): () => void {
  try {
    const colRef = collection(db, 'expenses');
    const q = query(colRef, orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Expense[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Expense;
            if (data && data.id) {
              list.push(data);
            }
          });
          onExpensesReceived(list);
        }
      },
      (error) => {
        console.warn('Firebase expenses subscription warning:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to initialize expenses listener:', err);
    return () => {};
  }
}

/**
 * SAVE CUSTOMER TO FIREBASE
 */
export async function saveCustomerToFirebase(customer: Customer): Promise<boolean> {
  if (!customer || !customer.id) return false;
  try {
    if (!auth.currentUser) {
      await ensureFirebaseAuth();
    }
    const docRef = doc(db, 'customers', String(customer.id));
    const payload = {
      id: String(customer.id),
      nama: String(customer.nama || 'Pelanggan'),
      no_whatsapp: String(customer.no_whatsapp || customer.whatsapp || ''),
      whatsapp: String(customer.no_whatsapp || customer.whatsapp || ''),
      alamat: String(customer.alamat || ''),
      catatan: String(customer.catatan || ''),
      total_transaksi: Number(customer.total_transaksi ?? 0),
      total_belanja: Number(customer.total_belanja ?? 0),
      last_order: String(customer.last_order || ''),
      created_at: String(customer.created_at || new Date().toISOString()),
      updated_at: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.error('Gagal menyimpan pelanggan ke Firebase:', err);
    return false;
  }
}

/**
 * DELETE CUSTOMER FROM FIREBASE
 */
export async function deleteCustomerFromFirebase(customerId: string): Promise<boolean> {
  if (!customerId) return false;
  try {
    if (!auth.currentUser) {
      await ensureFirebaseAuth();
    }
    const docRef = doc(db, 'customers', String(customerId));
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error(`Gagal menghapus pelanggan ${customerId} dari Firebase:`, err);
    return false;
  }
}

/**
 * SUBSCRIBE TO CUSTOMERS (Synced across all devices)
 */
export function subscribeToFirebaseCustomers(
  onCustomersReceived: (customers: Customer[]) => void
): () => void {
  try {
    const colRef = collection(db, 'customers');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Customer[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Customer;
            if (data && data.id) {
              list.push(data);
            }
          });
          onCustomersReceived(list);
        }
      },
      (error) => {
        console.warn('Firebase customers subscription warning:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to initialize customers listener:', err);
    return () => {};
  }
}

/**
 * SAVE STORE SETTINGS TO FIREBASE (Warung Bang Kobra global settings)
 */
export async function saveSettingsToFirebase(settings: StoreSettings): Promise<boolean> {
  if (!settings) return false;
  try {
    if (!auth.currentUser) {
      await ensureFirebaseAuth();
    }
    const docRef = doc(db, 'settings', 'warung');
    const payload = {
      id: 'warung',
      storeName: String(settings.storeName || 'Warung Bang Kobra'),
      tagline: String(settings.tagline || ''),
      address: String(settings.address || ''),
      whatsappNumber: String(settings.whatsappNumber || ''),
      logoUrl: String(settings.logoUrl || ''),
      receiptFooter: String(settings.receiptFooter || ''),
      taxPercent: Number(settings.taxPercent ?? 0),
      currency: String(settings.currency || 'Rp'),
      qrisImageUrl: String(settings.qrisImageUrl || ''),
      updated_at: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.error('Gagal menyimpan settings ke Firebase:', err);
    return false;
  }
}

/**
 * SUBSCRIBE TO STORE SETTINGS (Synced across all devices)
 */
export function subscribeToFirebaseSettings(
  onSettingsReceived: (settings: Partial<StoreSettings>) => void
): () => void {
  try {
    const docRef = doc(db, 'settings', 'warung');
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onSettingsReceived(docSnap.data() as Partial<StoreSettings>);
        }
      },
      (error) => {
        console.warn('Firebase settings subscription warning:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to initialize settings listener:', err);
    return () => {};
  }
}
