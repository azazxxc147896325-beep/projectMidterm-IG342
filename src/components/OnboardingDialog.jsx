import Icon from "./Icon";
import useModalA11y from "../hooks/useModalA11y";
import { useTheme } from "../contexts/ThemeContext";

export default function OnboardingDialog({ onComplete }) {
  const { t } = useTheme();
  const dialogRef = useModalA11y(onComplete);
  return <div className="modal-backdrop"><div ref={dialogRef} className="modal card onboarding-dialog" role="dialog" aria-modal="true" aria-labelledby="onboarding-title" aria-describedby="onboarding-description">
    <div className="onboarding-icon"><Icon name="sparkles" size={28}/></div>
    <h2 id="onboarding-title">{t("ยินดีต้อนรับสู่ QuoteMate", "Welcome to QuoteMate")}</h2>
    <p id="onboarding-description">{t("พื้นที่เล็ก ๆ สำหรับแบ่งปันประโยคดี ๆ และติดตามเรื่องราวจากเพื่อน", "A friendly space to share meaningful words and follow your friends' stories.")}</p>
    <ul><li>{t("เขียนและตกแต่งโพสต์ในสไตล์ของคุณ", "Write and style posts your way")}</li><li>{t("ค้นหาเพื่อน กดถูกใจ และแสดงความคิดเห็น", "Find friends, like posts, and comment")}</li><li>{t("ปรับสี ฟอนต์ และภาษาได้จากหน้าตั้งค่า", "Change colors, fonts, and language in Settings")}</li></ul>
    <button type="button" className="primary-button" onClick={onComplete}>{t("เริ่มใช้งาน", "Get started")}</button>
  </div></div>;
}
