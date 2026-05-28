// Utility helpers
const U = {
  rand(min, max) { return Math.random() * (max - min) + min; },
  irand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
  choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  weighted(items, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  },
  uuid() { return 'p' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); },
  clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
  gauss(mean = 0, sd = 1) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + sd * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  },
  ratingColor(r) {
    if (r >= 90) return "#ffd54a";
    if (r >= 80) return "#2ecc71";
    if (r >= 70) return "#4aa8ff";
    if (r >= 60) return "#a072ff";
    if (r >= 45) return "#93a0b5";
    return "#ff5b3a";
  },
  fmtMoney(n) {
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
    return "$" + n.toFixed(0);
  },
  fmtAvg(n) { if (isNaN(n) || !isFinite(n)) return ".000"; return n.toFixed(3).replace(/^0/, ""); },
  fmtERA(n) { if (isNaN(n) || !isFinite(n)) return "—"; return n.toFixed(2); },
  pad(n, w = 2) { return String(n).padStart(w, "0"); },
  // Deep clone via JSON
  clone(o) { return JSON.parse(JSON.stringify(o)); },
  // Avg rating helper
  avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; },
  // safe localStorage
  hashStr(s) {
    let h = 0; for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; } return h;
  },
  // Format date from sim day
  dateFromDay(year, dayOfYear) {
    const d = new Date(year, 2, 28); // March 28 opening
    d.setDate(d.getDate() + dayOfYear);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  },
  esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]); }
};
