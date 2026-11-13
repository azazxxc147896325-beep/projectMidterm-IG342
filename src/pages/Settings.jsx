import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import PageTitle from "../components/PageTitle";
import { useAuth } from "../contexts/AuthContext";
import { fonts, languages, themes, useTheme } from "../contexts/ThemeContext";
import { messageFrom, toAppUser } from "../utils/format";

export default function Settings() {
  const { theme, setTheme, mode, setMode, font, setFont, language, setLanguage, t } = useTheme();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const currentUser = toAppUser(profile);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState(() => window.location.hash.slice(1) || "appearance");
  useEffect(() => {
    const sections = ["appearance", "account", "developer"];
    const updateActiveSection = () => {
      let current = sections[0];
      for (const id of sections) if (document.getElementById(id)?.getBoundingClientRect().top <= 180) current = id;
      setActiveSection(current);
    };
    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveSection);
  }, []);
  const openSection = (event, id) => { event.preventDefault(); setActiveSection(id); window.history.replaceState(null, "", `#${id}`); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const logout = async () => { try { await signOut(); navigate("/login", { replace: true }); } catch (e) { setError(messageFrom(e)); } };
  return <div className="settings-page"><PageTitle eyebrow="PREFERENCES" title={t("ตั้งค่า", "Settings")} description={t("ปรับ QuoteMate ให้เป็นพื้นที่ในแบบของคุณ", "Make QuoteMate feel like your own space.")}/>{error && <div className="alert error">{error}</div>}<div className="settings-grid"><aside className="settings-menu card" aria-label={t("หมวดหมู่การตั้งค่า", "Settings categories")}><a href="#appearance" className={activeSection === "appearance" ? "active" : ""} aria-current={activeSection === "appearance" ? "true" : undefined} onClick={(event) => openSection(event, "appearance")}><Icon name="palette"/>{t("การแสดงผล", "Appearance")}</a><a href="#account" className={activeSection === "account" ? "active" : ""} aria-current={activeSection === "account" ? "true" : undefined} onClick={(event) => openSection(event, "account")}><Icon name="user"/>{t("บัญชี", "Account")}</a><a href="#developer" className={activeSection === "developer" ? "active" : ""} aria-current={activeSection === "developer" ? "true" : undefined} onClick={(event) => openSection(event, "developer")}><Icon name="info"/>{t("ผู้พัฒนา", "Developer")}</a></aside><div className="settings-content">
    <section id="appearance" className="settings-card card"><header><span><Icon name="palette"/></span><div><h2>{t("สีของเว็บไซต์", "Website color")}</h2><p>{t("เลือกโทนสีที่สบายตาและเป็นคุณ", "Choose a color theme that feels right for you.")}</p></div></header><div className="appearance-modes" role="group" aria-label={t("โหมดการแสดงผล", "Color mode")}>{[{ id: "light", th: "สว่าง", en: "Light" }, { id: "dark", th: "มืด", en: "Dark" }, { id: "system", th: "ตามระบบ", en: "System" }].map((item) => <button type="button" key={item.id} aria-pressed={mode === item.id} className={mode === item.id ? "active" : ""} onClick={() => setMode(item.id)}>{t(item.th, item.en)}</button>)}</div><div className="theme-grid">{themes.map((item) => <button key={item.id} className={theme === item.id ? "active" : ""} onClick={() => setTheme(item.id)}><i style={{background:item.color}}>{theme === item.id && <Icon name="check" size={16}/>}</i><span>{item.label}</span></button>)}</div><hr/><header><span><Icon name="type"/></span><div><h2>{t("รูปแบบตัวอักษร", "Font")}</h2><p>{t("ฟอนต์ที่รองรับทั้งภาษาไทยและอังกฤษ", "Fonts that support both Thai and English.")}</p></div></header><div className="font-list">{fonts.map((item) => <button key={item} onClick={() => setFont(item)} className={font === item ? "active" : ""} style={{fontFamily:item}}><span>Aa</span><div><strong>{item}</strong><small>{t("แบ่งปันคำพูดดี ๆ ทุกวัน", "Share meaningful words every day")}</small></div>{font === item && <Icon name="check"/>}</button>)}</div><hr/><header><span><Icon name="info"/></span><div><h2>{t("ภาษา", "Language")}</h2><p>{t("เลือกภาษาหลักของเว็บไซต์บนอุปกรณ์นี้", "Choose the app language for this device.")}</p></div></header><div className="language-list" role="group" aria-label={t("ภาษา", "Language")}>{languages.map((item) => <button type="button" key={item.id} onClick={() => setLanguage(item.id)} className={language === item.id ? "active" : ""}><span>{item.label}</span>{language === item.id && <Icon name="check" size={17}/>}</button>)}</div></section>
    <section id="account" className="settings-card card"><header><span><Icon name="user"/></span><div><h2>{t("บัญชีของฉัน", "My account")}</h2><p>{t("จัดการโปรไฟล์และการเข้าสู่ระบบ", "Manage your profile and sign-in.")}</p></div></header><div className="account-row"><div className="account-avatar"><Avatar user={currentUser} size="lg" online/></div><div className="account-details"><strong>{currentUser.name}</strong><span>@{currentUser.username}</span><small>{t("บัญชีของคุณ", "Your account")}</small></div><Link to="/profile" className="secondary-button account-profile-button"><Icon name="user" size={16}/>{t("ดูโปรไฟล์", "View profile")}</Link></div><button type="button" onClick={logout} className="logout-button"><Icon name="logout"/>{t("ออกจากระบบ", "Sign out")}<span>{t("ออกจากบัญชีบนอุปกรณ์นี้", "Sign out on this device")}</span><Icon name="chevron" size={16}/></button></section>
    <section id="developer" className="settings-card card developer-card"><header><span><Icon name="info"/></span><div><h2>{t("ผู้พัฒนา", "Developer")}</h2><p>{t("ข้อมูลผู้จัดทำโปรเจกต์ QuoteMate", "QuoteMate project developer information.")}</p></div></header><div className="developer-info"><div className="developer-monogram">KB</div><div><h3>{t("กิตตินันท์ บุญคุ้ม", "Kittinan Boonkhum")}</h3><p>{t("รหัสนักศึกษา 66112126", "Student ID 66112126")}</p><span>{t("IG342 การพัฒนาแอปพลิเคชันบนอุปกรณ์เคลื่อนที่ 1", "IG342 Mobile Application Development 1")}</span></div></div></section>
  </div></div></div>;
}
