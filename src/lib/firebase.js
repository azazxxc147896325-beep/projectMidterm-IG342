import { getAnalytics, isSupported } from "firebase/analytics";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDCyWw3_bWrATeNtm3okroIHgeZ_p4bXGQ",
  authDomain: "quotemate-7efa1.firebaseapp.com",
  projectId: "quotemate-7efa1",
  storageBucket: "quotemate-7efa1.firebasestorage.app",
  messagingSenderId: "605573110388",
  appId: "1:605573110388:web:bf94a07ca433eab1068f21",
  measurementId: "G-1R63B3M1TT",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

isSupported()
  .then((supported) => supported && getAnalytics(firebaseApp))
  .catch(() => null);
