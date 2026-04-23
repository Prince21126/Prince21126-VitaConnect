import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  initializeFirestore,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with enhanced settings for resilience
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: {
    kind: 'persistent',
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  }
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// Simple connection test
async function testConnection() {
  try {
    // Attempt to reach the server to verify actual connectivity
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error) {
      console.warn("Firestore connection check:", error.message);
    }
  }
}

testConnection();
