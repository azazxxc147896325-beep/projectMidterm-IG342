import { Link } from "react-router-dom";
import logoMark from "../assets/quotemate-logo.png";
import { useTheme } from "../contexts/ThemeContext";

export default function Logo({ compact = false }) {
  const { t } = useTheme();
  return (
    <Link to="/feed" className="brand" aria-label={`QuoteMate ${t("หน้าแรก", "home")}`}>
      <span className="brand-mark"><img src={logoMark} alt="" /></span>
      {!compact && <span>Quote<span>Mate</span></span>}
    </Link>
  );
}
