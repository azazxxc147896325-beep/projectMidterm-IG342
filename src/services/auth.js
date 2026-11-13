import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, runTransaction } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const internalEmail = (username) => `${username.trim().toLowerCase()}@quotemate.app`;

function googleUsername(user) {
  const emailName = user.email?.split("@")[0] || "user";
  const base = emailName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 18) || "user";
  return `${base}${user.uid.slice(0, 8).toLowerCase()}`;
}

async function ensureGoogleProfile(user) {
  const profileRef = doc(db, "profiles", user.uid);
  const existing = await getDoc(profileRef);
  if (existing.exists()) return { id: existing.id, ...existing.data() };

  const username = googleUsername(user);
  const usernameRef = doc(db, "usernames", username);
  const now = new Date().toISOString();
  const profile = {
    id: user.uid,
    username,
    display_name: user.displayName?.trim() || username,
    bio: "",
    avatar_url: user.photoURL || "",
    cover_theme: "mint",
    created_at: now,
    updated_at: now,
  };

  await runTransaction(db, async (transaction) => {
    const profileSnapshot = await transaction.get(profileRef);
    if (profileSnapshot.exists()) return;

    const usernameSnapshot = await transaction.get(usernameRef);
    if (usernameSnapshot.exists() && usernameSnapshot.data().uid !== user.uid) {
      throw new Error("ไม่สามารถสร้าง Username สำหรับบัญชีนี้ได้");
    }

    transaction.set(usernameRef, { uid: user.uid });
    transaction.set(profileRef, profile);
  });

  const saved = await getDoc(profileRef);
  return { id: saved.id, ...saved.data() };
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const credential = await signInWithPopup(auth, provider);
    const profile = await ensureGoogleProfile(credential.user);
    return { credential, profile };
  } catch (error) {
    if (error?.code === "auth/popup-closed-by-user") {
      throw new Error("หน้าต่างเข้าสู่ระบบถูกปิดก่อนดำเนินการเสร็จ");
    }
    if (error?.code === "auth/popup-blocked") {
      throw new Error("เบราว์เซอร์บล็อกหน้าต่างเข้าสู่ระบบ กรุณาอนุญาต Popup แล้วลองใหม่");
    }
    throw error;
  }
}

export async function signIn(username, password) {
  try {
    return await signInWithEmailAndPassword(auth, internalEmail(username), password);
  } catch {
    throw new Error("Username หรือ Password ไม่ถูกต้อง");
  }
}

export async function signUp(username, password) {
  const normalized = username.trim().toLowerCase();
  const usernameRef = doc(db, "usernames", normalized);
  if ((await getDoc(usernameRef)).exists()) throw new Error("Username นี้ถูกใช้งานแล้ว");

  let credential;
  try {
    credential = await createUserWithEmailAndPassword(auth, internalEmail(normalized), password);
  } catch (error) {
    if (error?.code === "auth/email-already-in-use") throw new Error("Username นี้ถูกใช้งานแล้ว");
    throw error;
  }

  const profile = {
    id: credential.user.uid,
    username: normalized,
    display_name: normalized,
    bio: "",
    avatar_url: "",
    cover_theme: "mint",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await runTransaction(db, async (transaction) => {
      const current = await transaction.get(usernameRef);
      if (current.exists()) throw new Error("Username นี้ถูกใช้งานแล้ว");
      transaction.set(usernameRef, { uid: credential.user.uid });
      transaction.set(doc(db, "profiles", credential.user.uid), profile);
    });
    return profile;
  } catch (error) {
    await deleteUser(credential.user).catch(() => {});
    throw error;
  }
}

export const signOut = () => firebaseSignOut(auth);
