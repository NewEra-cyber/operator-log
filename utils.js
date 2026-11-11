export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.prototype.slice.call(r.querySelectorAll(s));
export const pad2 = (n) => String(n).padStart(2, "0");
export const uid = () => Math.random().toString(36).slice(2, 10);

export const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

export function ymd(d) {
  const t = d ? new Date(d) : new Date();
  return t.getFullYear() + "-" + pad2(t.getMonth() + 1) + "-" + pad2(t.getDate());
}

export function addDays(key, n) {
  const d = new Date(key + "T12:00:00");
  d.setDate(d.getDate() + n);
  return ymd(d);
}

export function fmtDate(key) {
  const d = new Date(key + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
}

export function dayLetter(key) {
  const d = new Date(key + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "narrow" });
}

export function fmtRest(sec) {
  return sec < 120 ? sec + "S" : Math.round(sec / 60) + "M";
}

export function num(v, d) {
  const n = Number(v);
  return isFinite(n) ? n : (d || 0);
}

let toastTimer = null;
export function toast(msg, type) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.className = "toast show " + (type || "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = "toast"; }, 2800);
}

export function compressImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = function () {
      try {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        const cw = Math.max(1, Math.round(w * scale));
        const ch = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#0d1115";
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        URL.revokeObjectURL(url);
        // Changed to WebP for 30-50% smaller file sizes
        resolve(canvas.toDataURL("image/webp", quality));
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error("Image decode failed"));
    };
    img.src = url;
  });
}