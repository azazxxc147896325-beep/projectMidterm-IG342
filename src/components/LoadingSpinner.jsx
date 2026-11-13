import { useTheme } from "../contexts/ThemeContext";

export default function LoadingSpinner({ label }) {
  const { t } = useTheme();
  return <div className="loading-state" role="status"><span className="spinner"/><p>{label || t("กำลังโหลด...", "Loading...")}</p></div>;
}
