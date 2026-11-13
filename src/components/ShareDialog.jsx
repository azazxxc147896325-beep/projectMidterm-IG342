import { useMemo, useState } from "react";
import Icon from "./Icon";
import useModalA11y from "../hooks/useModalA11y";
import { useTheme } from "../contexts/ThemeContext";

const shareColors = { black: "#191c23", plain: "#ffffff", mint: "#eaf8f3", blue: "#edf5ff", purple: "#f3edff", pink: "#fff0f5", peach: "#fff1e9", yellow: "#fff8df" };
const shareFonts = { default: "Noto Sans Thai", prompt: "Prompt", kanit: "Kanit", sarabun: "Sarabun" };

function drawPattern(context, pattern, accent) {
  context.save(); context.globalAlpha = 0.12; context.strokeStyle = accent; context.fillStyle = accent;
  if (pattern === "dots") for (let y = 85; y < 555; y += 30) for (let x = 110; x < 1090; x += 30) { context.beginPath(); context.arc(x, y, 2, 0, Math.PI * 2); context.fill(); }
  if (pattern === "grid") { for (let x = 110; x < 1090; x += 42) { context.beginPath(); context.moveTo(x, 75); context.lineTo(x, 555); context.stroke(); } for (let y = 75; y < 555; y += 42) { context.beginPath(); context.moveTo(100, y); context.lineTo(1100, y); context.stroke(); } }
  if (pattern === "waves") for (let y = 105; y < 550; y += 42) { context.beginPath(); for (let x = 105; x < 1095; x += 5) context.lineTo(x, y + Math.sin(x / 24) * 8); context.stroke(); }
  if (pattern === "sparkles" || pattern === "petals") for (let y = 100; y < 550; y += 48) for (let x = 120; x < 1090; x += 48) {
    context.beginPath();
    if (pattern === "sparkles") { context.moveTo(x - 6, y); context.lineTo(x + 6, y); context.moveTo(x, y - 6); context.lineTo(x, y + 6); context.stroke(); }
    else { context.ellipse(x, y, 10, 4, Math.PI / 4, 0, Math.PI * 2); context.fill(); }
  }
  context.restore();
}

function wrapText(context, text, maxWidth) {
  const lines = [];
  let line = "";
  for (const character of [...text]) {
    const candidate = line + character;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line.trim());
      line = character;
    } else line = candidate;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, 7);
}

async function createQuoteCard(post, author) {
  await document.fonts?.ready;
  const tokens = getComputedStyle(document.documentElement);
  const accent = tokens.getPropertyValue("--accent").trim();
  const darkCard = post.card_theme === "black" || (document.documentElement.dataset.mode === "dark" && ["plain", "theme"].includes(post.card_theme));
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, "#e6f5f0");
  gradient.addColorStop(0.58, "#ffffff");
  gradient.addColorStop(1, "#e8f2fb");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1200, 630);

  context.shadowColor = "rgba(38,56,50,.12)";
  context.shadowBlur = 35;
  context.beginPath();
  context.roundRect(95, 70, 1010, 490, 40);
  context.fillStyle = darkCard ? "#191c23" : post.card_theme === "theme" ? tokens.getPropertyValue("--accent-faint").trim() : shareColors[post.card_theme] || shareColors.plain;
  context.fill();
  context.shadowColor = "transparent";
  drawPattern(context, post.card_pattern, accent);

  context.fillStyle = accent;
  context.font = "700 34px 'Noto Sans Thai', sans-serif";
  context.fillText("QuoteMate", 155, 140);
  context.font = "100px Georgia, serif";
  context.fillStyle = "#9bd2c2";
  context.fillText("“", 145, 255);

  context.fillStyle = darkCard ? "#f4f6fa" : "#263832";
  const selectedFont = shareFonts[post.card_font] || shareFonts.default;
  context.font = `500 39px '${selectedFont}', sans-serif`;
  const lines = wrapText(context, post.content, 820);
  const lineHeight = 58;
  const startY = 220 + Math.max(0, (5 - lines.length) * 12);
  lines.forEach((line, index) => context.fillText(line, 225, startY + (index * lineHeight)));

  context.fillStyle = darkCard ? "#b7c0ce" : "#70817b";
  context.font = `500 25px '${selectedFont}', sans-serif`;
  context.fillText(`— ${author.name}  @${author.username}`, 225, 505);
  context.fillStyle = accent;
  context.beginPath();
  context.arc(1015, 493, 24, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = "700 18px 'Noto Sans Thai', sans-serif";
  context.textAlign = "center";
  context.fillText("QM", 1015, 500);
  context.textAlign = "left";

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("ไม่สามารถสร้างรูปการ์ดได้");
  return blob;
}

export default function ShareDialog({ post, author, onClose }) {
  const { t } = useTheme();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const shareUrl = useMemo(() => `${window.location.origin}${import.meta.env.BASE_URL}post/${post.id}`, [post.id]);
  const dialogRef = useModalA11y(busy ? undefined : onClose);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage(t("คัดลอกลิงก์แล้ว", "Link copied"));
    } catch {
      const input = document.createElement("textarea");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      setMessage(t("คัดลอกลิงก์แล้ว", "Link copied"));
    }
  };

  const shareCard = async () => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const blob = await createQuoteCard(post, author);
      const file = new File([blob], `quotemate-${post.id}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "QuoteMate", text: post.content, files: [file] });
        setMessage(t("แชร์รูปการ์ดแล้ว", "Card shared"));
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
        setMessage(t("ดาวน์โหลดรูปการ์ดแล้ว", "Card downloaded"));
      }
    } catch (error) {
      if (error.name !== "AbortError") setMessage(error.message || t("แชร์รูปไม่สำเร็จ", "Unable to share image"));
    } finally {
      setBusy(false);
    }
  };

  return <div className="modal-backdrop" onMouseDown={() => { if (!busy) onClose(); }}>
    <section ref={dialogRef} className="share-dialog card" role="dialog" aria-modal="true" aria-labelledby="share-title" tabIndex="-1" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><h2 id="share-title">{t("แชร์คำพูดนี้", "Share this quote")}</h2><p>{t("เลือกแชร์เป็นรูปการ์ดหรือส่งลิงก์ให้เพื่อน", "Share it as an image card or send a link to friends.")}</p></div><button className="icon-button" disabled={busy} onClick={onClose} aria-label={t("ปิด", "Close")}><Icon name="x"/></button></header>
      <div className={`share-preview card-theme-${post.card_theme || "plain"} card-pattern-${post.card_pattern || "none"} post-font-${post.card_font || "default"}`}><span>“</span><p>{post.content}</p><small>— {author.name} · @{author.username}</small><b>QuoteMate</b></div>
      <div className="share-options">
        <button className="share-option share-image" onClick={shareCard} disabled={busy}><span><Icon name="image"/></span><div><strong>{busy ? t("กำลังสร้างรูป...", "Creating image...") : t("แชร์เป็นรูปการ์ด", "Share as image card")}</strong><small>{t("เปิดเมนูแชร์ หรือดาวน์โหลดเป็น PNG", "Open the share menu or download as PNG")}</small></div><Icon name="chevron" size={17}/></button>
        <button className="share-option" onClick={copyLink}><span><Icon name="share"/></span><div><strong>{t("คัดลอกลิงก์โพสต์", "Copy post link")}</strong><small>{t("เปิดตรงมายังโพสต์นี้", "Open directly to this post")}</small></div><Icon name="chevron" size={17}/></button>
      </div>
      {message && <div className="share-message" role="status">{message}</div>}
    </section>
  </div>;
}
