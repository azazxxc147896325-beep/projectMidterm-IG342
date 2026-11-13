import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import AnimatedBackground from "../components/AnimatedBackground";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { messageFrom } from "../utils/format";

export default function Login() {
  const { t } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const continueWithGoogle = async () => {
    setBusy(true);
    setFormError("");
    try {
      await signInWithGoogle();
      navigate(location.state?.from || "/feed", { replace: true });
    } catch (error) {
      setFormError(messageFrom(error));
    } finally {
      setBusy(false);
    }
  };

  return <AuthFrame
    title={t("ยินดีต้อนรับสู่ QuoteMate", "Welcome to QuoteMate")}
    subtitle={t(
      "เข้าสู่ระบบด้วยบัญชี Google เพื่อแบ่งปันประโยคดี ๆ กับเพื่อน",
      "Continue with Google to share meaningful words with friends.",
    )}
  >
    <div className="auth-form">
      {formError && <div className="alert error" role="alert">{formError}</div>}
      <button
        type="button"
        className="google-auth-button"
        onClick={continueWithGoogle}
        disabled={busy}
        aria-busy={busy}
      >
        <GoogleLogo />
        {busy
          ? t("กำลังเชื่อมต่อ Google...", "Connecting to Google...")
          : t("ดำเนินการต่อด้วย Google", "Continue with Google")}
      </button>
    </div>
  </AuthFrame>;
}

function GoogleLogo() {
  return <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.83-1.76-5.62-4.13H3.03v2.62A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.38 13.86A6.02 6.02 0 0 1 6.06 12c0-.65.11-1.28.32-1.86V7.52H3.03A10 10 0 0 0 2 12c0 1.61.39 3.14 1.03 4.48l3.35-2.62Z" />
    <path fill="#EA4335" d="M12 6.01c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.97 5.52l3.35 2.62C7.17 7.77 9.39 6.01 12 6.01Z" />
  </svg>;
}

export function AuthFrame({ title, subtitle, children }) {
  const { t } = useTheme();
  return <main className="auth-page">
    <AnimatedBackground />
    <section className="auth-card">
      <Logo />
      <div className="auth-intro"><h1>{title}</h1><p>{subtitle}</p></div>
      {children}
      <small className="auth-note">
        {t(
          "การใช้งานถือว่าคุณยอมรับเงื่อนไขและนโยบายความเป็นส่วนตัว",
          "By continuing, you agree to the terms and privacy policy.",
        )}
      </small>
    </section>
  </main>;
}
