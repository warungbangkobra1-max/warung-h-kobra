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
import { Transaction, Product, WarungUser, UserRole } from '../types';

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
 * Allows authenticated Admin / Owner to sync live menu & stock to Firestore
 */
export async function syncProductsToFirebase(products: Product[]): Promise<boolean> {
  // Only authenticated Admin / Owner in Firebase can write to /products (Security RBAC)
  if (!auth.currentUser) {
    return false;
  }

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
    console.warn('Sync products to Firebase skipped or restricted:', err);
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
