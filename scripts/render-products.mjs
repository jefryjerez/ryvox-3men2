// Exporta las fotos de producto desde los modelos 3D con Chrome headless (solo desarrollo).
// Requiere `npm run dev` corriendo. Uso: node scripts/render-products.mjs [modelo[:color]=nombre ...]
//   sin argumentos: soporte y dispensador en los seis colores.
// Cada trabajo abre /render/<modelo>?color=<color>, fuerza el render y guarda el PNG transparente vía /api/dev/render;
// después scripts/compose-render.mjs lo monta sobre el fondo de estudio y genera el .webp final.
import { spawn, execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const BASE = process.env.RENDER_BASE ?? "http://localhost:3000";
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(existsSync);
if (!CHROME) throw new Error("No se encontró Chrome ni Edge");

const COLORS = ["negro", "azul", "verde", "rosado", "rojo", "dorado"];
const DEFAULT = Object.fromEntries([
  ...COLORS.map((c) => [`airbrush-mount:${c}`, `soporte-aerografo-${c}`]),
  ...COLORS.map((c) => [`dispenser:${c}`, `dispensador-cuchillas-${c}`]),
]);
const jobs = process.argv.slice(2).length ? Object.fromEntries(process.argv.slice(2).map((a) => a.split("="))) : DEFAULT;

const PORT = 9333;
const chrome = spawn(CHROME, [
  "--headless=new", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--hide-scrollbars", "--window-size=1300,1300",
  "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(tmpdir(), "ryvox-chrome-render")}`, "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await fetch(`http://127.0.0.1:${PORT}/json`).then((r) => r.json());
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error("Chrome no respondió al puerto de depuración");
}

class Cdp {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); ws.onmessage = (e) => { const m = JSON.parse(e.data); const p = this.pending.get(m.id); if (p) { this.pending.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result); } }; }
  send(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject })); }
  async eval(expression) { const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "eval error"); return r.result.value; }
}

try {
  const wsUrl = await target();
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const cdp = new Cdp(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  for (const [job, name] of Object.entries(jobs)) {
    const [model, color] = job.split(":");
    await cdp.send("Page.navigate", { url: `${BASE}/es/render/${model}${color ? `?color=${color}` : ""}` });
    let ready = false;
    for (let i = 0; i < 120 && !ready; i++) {
      await sleep(500);
      ready = await cdp.eval(`typeof window.__ryvoxExport === "function" && !!document.querySelector("canvas") && document.querySelector("canvas").width === 1200`).catch(() => false);
    }
    if (!ready) throw new Error(`La página /render/${model} no quedó lista`);
    const webgl = await cdp.eval(`(() => { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); })()`);
    if (!webgl) throw new Error("Chrome headless no ofrece WebGL");
    await sleep(2500); // texturas (logo) y entorno
    const out = await cdp.eval(`window.__ryvoxExport(${JSON.stringify(name)})`);
    console.log(job, "->", out);
    execFileSync(process.execPath, ["scripts/compose-render.mjs", name], { stdio: "inherit" });
  }
  ws.close();
} finally {
  chrome.kill();
}
