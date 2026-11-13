import useModalA11y from "../hooks/useModalA11y";
import { useTheme } from "../contexts/ThemeContext";

export default function ConfirmDialog({ title, description, busy, onConfirm, onCancel }) {
  const { t } = useTheme();
  const dialogRef = useModalA11y(busy ? undefined : onCancel);
  return <div className="modal-backdrop"><div ref={dialogRef} className="modal card" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description" tabIndex="-1"><h2 id="confirm-title">{title}</h2><p id="confirm-description">{description}</p><div className="modal-actions"><button className="secondary-button" disabled={busy} onClick={onCancel}>{t("ยกเลิก", "Cancel")}</button><button className="danger-button" disabled={busy} onClick={onConfirm}>{busy ? t("กำลังลบ...", "Deleting...") : t("ลบ", "Delete")}</button></div></div></div>;
}
