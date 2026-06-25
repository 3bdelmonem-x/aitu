import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { nextId } from './helpers';

// Make DB available globally
export const DB = {
  departments: [],
  sessions: [],
  places: [],
  supervisors: [],
  place_supervisors: [],
  students: [],
  enrollments: [],
  attendance: [],
  eval_templates: [],
  evaluations: [],
  reports: [],
  daily_reports: [],
  users: [],
  excuse_requests: [],
  holidays: [],
  factories: [],
  external_requests: []
};

// Assign to window for helpers
if (typeof window !== 'undefined') {
  window.DB = DB;
}

let loadedCollections = new Set();
let unsubscribers = [];

export const addDocWithId = async (collectionName, data) => {
  const col = DB[collectionName];
  if (!col) throw new Error(`Collection ${collectionName} not found`);
  const id = nextId(col);
  const docRef = await addDoc(collection(db, collectionName), { ...data, id });
  return id;
};

export const updateDocById = async (collectionName, id, data) => {
  const item = DB[collectionName]?.find(x => x.id === id);
  if (item?._docId) {
    await updateDoc(doc(db, collectionName, item._docId), data);
  }
};

export const deleteDocById = async (collectionName, id) => {
  const item = DB[collectionName]?.find(x => x.id === id);
  if (item?._docId) {
    await deleteDoc(doc(db, collectionName, item._docId));
  }
};

export const loadCollection = async (collectionName) => {
  if (loadedCollections.has(collectionName)) return;
  
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    DB[collectionName] = snapshot.docs.map(doc => ({ ...doc.data(), _docId: doc.id }));
    loadedCollections.add(collectionName);
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(collection(db, collectionName), (snap) => {
      DB[collectionName] = snap.docs.map(doc => ({ ...doc.data(), _docId: doc.id }));
      // Update window.DB
      if (typeof window !== 'undefined') {
        window.DB = DB;
      }
    });
    unsubscribers.push(unsubscribe);
  } catch (error) {
    console.error(`Error loading ${collectionName}:`, error);
  }
};

export const loadCoreData = async () => {
  const coreCollections = ['departments', 'sessions', 'places', 'supervisors', 'users'];
  await Promise.all(coreCollections.map(loadCollection));
};

export const ensureCollections = async (collections) => {
  const pending = collections.filter(c => c && !loadedCollections.has(c));
  await Promise.all(pending.map(loadCollection));
};

export const cleanupListeners = () => {
  unsubscribers.forEach(unsub => unsub());
  unsubscribers = [];
  loadedCollections.clear();
  Object.keys(DB).forEach(key => { DB[key] = []; });
  if (typeof window !== 'undefined') {
    window.DB = DB;
  }
};