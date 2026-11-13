/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, requireSupabase, supabase } from "../lib/supabase";

const AuthContext = createContext(null);
const internalEmail = (username) => `${username.toLowerCase()}@quotemate.app`;

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); return null; }
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error) throw error;
    setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return undefined; }
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) { try { await loadProfile(data.session.user.id); } catch { setProfile(null); } }
      if (active) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) setTimeout(() => loadProfile(next.user.id).catch(() => setProfile(null)), 0);
      else setProfile(null);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [loadProfile]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return undefined;
    const channel = supabase.channel(`own-profile-${userId}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` }, () => loadProfile(userId).catch(() => {})).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadProfile, session?.user?.id]);

  const signIn = async (username, password) => {
    requireSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email: internalEmail(username), password });
    if (error) throw new Error("Username หรือ Password ไม่ถูกต้อง");
  };
  const signUp = async (username, password) => {
    requireSupabase();
    const normalized = username.toLowerCase();
    const { data: exists, error: checkError } = await supabase.rpc("username_available", { candidate: normalized });
    const rpcMissing = checkError?.code === "PGRST202" || checkError?.message?.includes("schema cache");
    if (rpcMissing) throw new Error("ระบบฐานข้อมูลยังตั้งค่าไม่ครบ กรุณาติดตั้ง QuoteMate schema ก่อนสมัครสมาชิก");
    if (checkError) throw checkError;
    if (!exists) throw new Error("Username นี้ถูกใช้งานแล้ว");
    const { data, error } = await supabase.auth.signUp({
      email: internalEmail(normalized), password,
      options: { data: { username: normalized, display_name: normalized } },
    });
    if (error) {
      const duplicate = error.message?.toLowerCase().includes("already") || error.message?.toLowerCase().includes("duplicate");
      throw new Error(duplicate ? "Username นี้ถูกใช้งานแล้ว" : error.message);
    }
    if (!data.session) throw new Error("สร้างบัญชีแล้ว แต่โปรเจกต์ยังเปิด Email confirmation อยู่ กรุณาปิดใน Supabase Auth settings");
  };
  const signOut = async () => { requireSupabase(); const { error } = await supabase.auth.signOut(); if (error) throw error; };
  const value = useMemo(() => ({ session, user: session?.user || null, profile, loading, signIn, signUp, signOut, refreshProfile: () => loadProfile(session?.user.id) }), [session, profile, loading, loadProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
