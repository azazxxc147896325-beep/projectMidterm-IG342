import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import { AuthFrame, Field } from "./Login";
import { useAuth } from "../contexts/AuthContext";
import { messageFrom } from "../utils/format";
import { useTheme } from "../contexts/ThemeContext";

export default function Register() {
  const { t } = useTheme();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!/^[A-Za-z]{6,}$/.test(form.username)) next.username = t("ใช้ตัวอักษรภาษาอังกฤษอย่างน้อย 6 ตัวเท่านั้น", "Use at least 6 English letters only");
    if (form.password.length < 8) next.password = t("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", "Password must be at least 8 characters");
    if (form.password !== form.confirm) next.confirm = t("รหัสผ่านไม่ตรงกัน", "Passwords do not match");
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true); setFormError("");
    try { await signUp(form.username.trim(), form.password); navigate("/feed", { replace: true }); }
    catch (error) { setFormError(messageFrom(error)); }
    finally { setBusy(false); }
  };
  return <AuthFrame title={t("สร้างพื้นที่ของคุณ", "Create your space")} subtitle={t("เริ่มเก็บและแบ่งปันคำพูดที่มีความหมาย", "Start collecting and sharing meaningful words.")}>
    <form onSubmit={submit} className="auth-form" noValidate>
      <Field label="Username" icon="at" error={errors.username} hint={t("ตัวอักษรภาษาอังกฤษอย่างน้อย 6 ตัว", "At least 6 English letters")}><input value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} placeholder="yourusername" /></Field>
      <Field label="Password" icon="lock" error={errors.password} hint={t("อย่างน้อย 8 ตัวอักษร", "At least 8 characters")}><input value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} type={showPassword ? "text" : "password"} placeholder="••••••••" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={t("แสดงหรือซ่อนรหัสผ่าน", "Show or hide password")}><Icon name="eye" size={18} /></button></Field>
      <Field label={t("ยืนยัน Password", "Confirm password")} icon="lock" error={errors.confirm}><input value={form.confirm} onChange={(e) => setForm({...form, confirm: e.target.value})} type={showPassword ? "text" : "password"} placeholder="••••••••" /></Field>
      {formError && <div className="alert error" role="alert">{formError}</div>}
      <button className="primary-button auth-submit" disabled={busy}>{busy ? t("กำลังสร้างบัญชี...", "Creating account...") : t("สร้างบัญชี", "Create account")} {!busy && <Icon name="chevron" size={18} />}</button>
    </form>
    <p className="auth-switch">{t("มีบัญชีแล้ว?", "Already have an account?")} <Link to="/login">{t("เข้าสู่ระบบ", "Sign in")}</Link></p>
  </AuthFrame>;
}
