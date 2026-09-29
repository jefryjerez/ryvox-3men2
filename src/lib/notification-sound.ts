/**
 * Timbre propio para "nuevo pedido", estilo caja registradora ("cha-ching"): generado con Web Audio,
 * no es un archivo de audio de nadie más (no se copia el sonido de Shopify ni de ninguna otra tienda,
 * eso sería usar su propiedad sin permiso). Solo suena mientras el panel está abierto en primer plano;
 * es lo único que el navegador permite personalizar (la notificación del sistema usa siempre su sonido propio).
 */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

/** Campanita: tono principal + un armónico fino arriba, para que suene metálica en vez de plana. */
function bell(ac: AudioContext, dest: AudioNode, freq: number, start: number, duration: number, gainPeak: number) {
  const t0 = ac.currentTime + start;
  for (const [mult, level] of [[1, 1], [2.76, 0.28], [4.1, 0.12]] as const) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * mult;
    osc.connect(gain).connect(dest);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(gainPeak * level, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }
}

/** Chispa aguda y muy corta ("clink" de moneda) para el golpe de la caja registradora. */
function clink(ac: AudioContext, dest: AudioNode, start: number, gainPeak: number) {
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(2600, t0);
  osc.frequency.exponentialRampToValueAtTime(1800, t0 + 0.06);
  osc.connect(gain).connect(dest);
  gain.gain.setValueAtTime(gainPeak, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
  osc.start(t0);
  osc.stop(t0 + 0.12);
}

/** Se pidió que sonara fuerte de verdad: volumen bien por encima de lo sutil de antes. */
export function playOrderChime() {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();

  const master = ac.createGain();
  master.gain.value = 1.3;
  master.connect(ac.destination);

  // "cha" — golpe grave + el primer clink
  bell(ac, master, 660, 0, 0.22, 0.38);
  clink(ac, master, 0.01, 0.28);
  // "ching" — el par agudo que se estira, como el timbre de la caja al abrirse
  bell(ac, master, 1046.5, 0.1, 0.5, 0.34); // C6
  bell(ac, master, 1568, 0.14, 0.55, 0.26); // G6
  clink(ac, master, 0.11, 0.28);
}
