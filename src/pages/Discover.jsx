import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import LoadingSpinner from "../components/LoadingSpinner";
import PageTitle from "../components/PageTitle";
import UserCard from "../components/UserCard";
import { useAuth } from "../contexts/AuthContext";
import useRealtimeRefresh from "../hooks/useRealtimeRefresh";
import { findPeople } from "../services/api";
import { messageFrom } from "../utils/format";
import { useTheme } from "../contexts/ThemeContext";

export default function Discover() {
  const { t } = useTheme();
  const { user } = useAuth(); const [params, setParams] = useSearchParams(); const [query, setQuery] = useState(() => params.get("q") || ""); const [people, setPeople] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const requestRef = useRef(0);
  const search = useCallback(async (showLoading = true) => {
    const requestId = ++requestRef.current;
    if (showLoading) setLoading(true);
    setError("");
    try { const result = await findPeople(user.id, query); if (requestId === requestRef.current) setPeople(result); }
    catch (e) { if (requestId === requestRef.current) setError(messageFrom(e)); }
    finally { if (showLoading) setLoading(false); }
  }, [query, user.id]);
  const refreshInBackground = useCallback(() => search(false), [search]);
  useRealtimeRefresh(`discover-${user.id}`, ["profiles", "friend_requests", "friendships"], refreshInBackground);
  useEffect(() => { const timer = setTimeout(search, 300); return () => clearTimeout(timer); }, [search]);
  return <div className="page-stack"><PageTitle eyebrow="DISCOVER" title={t("ค้นหาเพื่อนใหม่", "Find new friends")} description={t("พบผู้คนที่ชอบเก็บเรื่องราวและคำพูดดี ๆ เหมือนคุณ", "Meet people who enjoy sharing stories and meaningful words like you.")}/><form className="discover-search card" onSubmit={(e) => { e.preventDefault(); setParams(query.trim() ? { q: query.trim() } : {}); search(); }}><Icon name="search"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("ค้นหา Username หรือชื่อที่แสดง...", "Search username or display name...")}/><button>{t("ค้นหา", "Search")}</button></form>{error && <div className="alert error">{error}</div>}<div className="section-label"><h2>{query ? t("ผลการค้นหา", "Search results") : t("สมาชิก QuoteMate", "QuoteMate members")}</h2><span>{people.length} {t("คน", "people")}</span></div>{loading ? <LoadingSpinner/> : people.length ? <div className="user-grid">{people.map((person) => <UserCard key={person.id} user={person} currentUserId={user.id} onChanged={refreshInBackground}/>)}</div> : <EmptyState icon="search" title={t("ยังไม่พบผู้ใช้ที่ค้นหา", "No matching users found")} description={t("ลองใช้ชื่อหรือ Username อื่นดูนะ", "Try another name or username.")}/>}</div>;
}
