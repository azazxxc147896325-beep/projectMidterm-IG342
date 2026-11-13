/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { startPresence } from "../services/presence";
import * as firebaseAuth from "../services/auth";

const AuthContext = createContext(null);

async function fetchProfile(uid) {
  const snapshot = await getDoc(doc(db, "profiles", uid));
  if (!snapshot.exists()) throw new Error("ไม่พบโปรไฟล์ของบัญชีนี้");
  return { id: snapshot.id, ...snapshot.data() };
}

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const stopPresence = useRef(null);
  const presenceUid = authUser && profile ? authUser.uid : null;
  useEffect(() => {
    if (!presenceUid) return undefined;
    const stop = startPresence(presenceUid);
    stopPresence.current = stop;
    return () => {
      stopPresence.current = null;
      void stop();
    };
  }, [presenceUid]);

  const signOut = async () => {
    const stopped = stopPresence.current?.();
    // Do not delay sign-out when a device has lost its connection.
    if (stopped) await Promise.race([stopped, new Promise((resolve) => window.setTimeout(resolve, 1500))]);
    await firebaseAuth.signOut();
  };

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) { setProfile(null); return null; }
    const next = await fetchProfile(auth.currentUser.uid);
    setProfile(next);
    return next;
  }, []);

  useEffect(() => onAuthStateChanged(auth, async (nextUser) => {
    setLoading(true);
    setAuthUser(nextUser);
    if (!nextUser) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try { setProfile(await fetchProfile(nextUser.uid)); }
    catch { setProfile(null); }
    finally { setLoading(false); }
  }), []);

  useEffect(() => {
    if (!authUser) return undefined;
    return onSnapshot(doc(db, "profiles", authUser.uid), (snapshot) => {
      if (snapshot.exists()) setProfile({ id: snapshot.id, ...snapshot.data() });
    });
  }, [authUser]);

  const signIn = async (username, password) => {
    const credential = await firebaseAuth.signIn(username, password);
    try {
      const next = await fetchProfile(credential.user.uid);
      setAuthUser(credential.user);
      setProfile(next);
      return next;
    } catch (error) {
      await firebaseAuth.signOut();
      throw error;
    }
  };

  const signUp = async (username, password) => {
    const next = await firebaseAuth.signUp(username, password);
    setAuthUser(auth.currentUser);
    setProfile(next);
    return next;
  };

  const signInWithGoogle = async () => {
    const { credential, profile: next } = await firebaseAuth.signInWithGoogle();
    setAuthUser(credential.user);
    setProfile(next);
    return next;
  };

  const user = useMemo(() => authUser && profile ? {
    id: authUser.uid,
    uid: authUser.uid,
    email: authUser.email,
  } : null, [authUser, profile]);
  const session = useMemo(() => user ? { user } : null, [user]);
  const value = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshProfile,
  }), [session, user, profile, loading, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
