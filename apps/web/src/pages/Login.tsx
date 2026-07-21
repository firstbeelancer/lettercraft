import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import appLogo from "@/assets/logo-white.png";

// ——————————————————————————————————————————————
// LetterGlitch — фоновый глитч-канвас (эффект мерцающих букв)
// ——————————————————————————————————————————————
const GLITCH_CHARS = [
  "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
  "!","@","#","$","&","*","(",")","-","_","+","=","/","[","]","{","}",";",":","<",">",",",
  "0","1","2","3","4","5","6","7","8","9",
];

type GlitchLetter = {
  char: string;
  color: string;
  targetColor: string;
  progress: number;
};

type LetterGlitchProps = {
  glitchColors?: string[];
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  className?: string;
  charWidth?: number;
  charHeight?: number;
  fontSize?: number;
};

function hexToRgb(hex: string) {
  let h = hex.trim();
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const m = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function lerpRgb(from: { r: number; g: number; b: number }, to: { r: number; g: number; b: number }, t: number) {
  return `rgb(${Math.round(from.r + (to.r - from.r) * t)}, ${Math.round(from.g + (to.g - from.g) * t)}, ${Math.round(from.b + (to.b - from.b) * t)})`;
}

function LetterGlitch({
  glitchColors = ["#5e4491", "#A476FF", "#241a38"],
  glitchSpeed = 33,
  centerVignette = false,
  outerVignette = false,
  smooth = true,
  className = "",
  charWidth = 10,
  charHeight = 20,
  fontSize = 16,
}: LetterGlitchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lettersRef = useRef<GlitchLetter[]>([]);
  const gridRef = useRef({ columns: 0, rows: 0 });
  const rafRef = useRef<number>(0);
  const lastGlitchRef = useRef<number>(Date.now());
  const speedRef = useRef<number>(glitchSpeed);
  const colorsRef = useRef<string[]>(glitchColors);
  const smoothRef = useRef<boolean>(smooth);

  const randChar = useCallback(() => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)], []);
  const randColor = useCallback(() => colorsRef.current[Math.floor(Math.random() * colorsRef.current.length)], []);

  const getGrid = useCallback((w: number, h: number) => {
    return {
      columns: Math.ceil(w / charWidth),
      rows: Math.ceil(h / charHeight),
    };
  }, [charWidth, charHeight]);

  const initGrid = useCallback((columns: number, rows: number) => {
    gridRef.current = { columns, rows };
    const total = columns * rows;
    lettersRef.current = Array.from({ length: total }, () => ({
      char: randChar(),
      color: randColor(),
      targetColor: randColor(),
      progress: 1,
    }));
  }, [randChar, randColor]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = "top";
    const cols = gridRef.current.columns;
    lettersRef.current.forEach((cell, i) => {
      const x = (i % cols) * charWidth;
      const y = Math.floor(i / cols) * charHeight;
      ctx.fillStyle = cell.color;
      ctx.fillText(cell.char, x, y);
    });
  }, [charHeight, charWidth, fontSize]);

  const mutate = useCallback(() => {
    if (!lettersRef.current.length) return;
    const total = lettersRef.current.length;
    const count = Math.max(1, Math.floor(total * 0.05));
    for (let k = 0; k < count; k++) {
      const idx = Math.floor(Math.random() * total);
      const cell = lettersRef.current[idx];
      if (!cell) continue;
      cell.char = randChar();
      cell.targetColor = randColor();
      cell.progress = smoothRef.current ? 0 : 1;
      if (!smoothRef.current) cell.color = cell.targetColor;
    }
  }, [randChar, randColor]);

  const tickColors = useCallback(() => {
    let needsDraw = false;
    for (const cell of lettersRef.current) {
      if (cell.progress < 1) {
        cell.progress += 0.05;
        if (cell.progress > 1) cell.progress = 1;
        let fr = hexToRgb(cell.color);
        if (!fr && cell.color.startsWith("rgb")) {
          const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(cell.color);
          if (m) fr = { r: +m[1], g: +m[2], b: +m[3] };
        }
        const tr =
          hexToRgb(cell.targetColor) ??
          (cell.targetColor.startsWith("rgb")
            ? (() => {
                const mm = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(cell.targetColor);
                return mm ? { r: +mm[1], g: +mm[2], b: +mm[3] } : null;
              })()
            : null);

        if (fr && tr) {
          cell.color = lerpRgb(fr, tr, cell.progress);
          needsDraw = true;
        }
      }
    }
    if (needsDraw) draw();
  }, [draw]);

  const resize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxRef.current = ctx;
    const { columns, rows } = getGrid(rect.width, rect.height);
    initGrid(columns, rows);
    draw();
  }, [draw, getGrid, initGrid]);

  const loop = useCallback(() => {
    const now = Date.now();
    if (now - lastGlitchRef.current >= speedRef.current) {
      mutate();
      draw();
      lastGlitchRef.current = now;
    }
    if (smoothRef.current) tickColors();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, mutate, tickColors]);

  useEffect(() => { speedRef.current = glitchSpeed; }, [glitchSpeed]);
  useEffect(() => { colorsRef.current = glitchColors; }, [glitchColors]);
  useEffect(() => { smoothRef.current = smooth; }, [smooth]);

  useEffect(() => {
    resize();
    loop();
    let t: number;
    const onResize = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        cancelAnimationFrame(rafRef.current);
        resize();
        loop();
      }, 100) as unknown as number;
    };
    window.addEventListener("resize", onResize);

    const ro = new ResizeObserver(() => onResize());
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, [loop, resize]);

  return (
    <div ref={containerRef} className={`letter-glitch ${className}`}>
      <canvas ref={canvasRef} className="letter-glitch-canvas" />
      {outerVignette && <div className="glitch-vignette glitch-vignette--outer" />}
      {centerVignette && <div className="glitch-vignette glitch-vignette--center" />}
    </div>
  );
}

// ——————————————————————————————————————————————
// Иконки (inline SVG — без эмодзи)
// ——————————————————————————————————————————————
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.75 6.75h16.5v10.5H3.75V6.75Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4.5 7.5 7.5 5.25 7.5-5.25" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="12" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L11 22 22 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5v5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16.4" r="1" fill="currentColor" />
    </svg>
  );
}

// ——————————————————————————————————————————————
// Main
// ——————————————————————————————————————————————
export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid) {
      setError("Введите корректный email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const resp = await api.requestMagicLink(email.trim().toLowerCase());
      setDevLink(resp.devLink || null);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Не удалось отправить ссылку. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  const reset = useCallback(() => {
    setSent(false);
    setEmail("");
    setError("");
    setDevLink(null);
    setCopied(false);
  }, []);

  const copyLink = useCallback(async () => {
    if (!devLink) return;
    try {
      await navigator.clipboard.writeText(devLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = devLink;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setCopied(true); } catch {}
      document.body.removeChild(ta);
      window.setTimeout(() => setCopied(false), 2200);
    }
  }, [devLink]);

  return (
    <main className="auth-page">
      {/* Фоновый градиент — purple/galaxy/lilac (заменил galaxy.jpg) */}
      <div className="galaxy-gradient" aria-hidden="true" />

      {/* Глитч-канвас (мерцающие буквы) */}
      <div className="bg-glitch-layer" aria-hidden="true">
        <LetterGlitch
          glitchColors={["#5e4491", "#A476FF", "#2e1a52", "#7e41c7", "#c6a0ff", "#241a38"]}
          glitchSpeed={38}
          outerVignette
          centerVignette
          smooth
          charWidth={14}
          charHeight={24}
          fontSize={18}
        />
      </div>

      <div className="cosmic-shade" aria-hidden="true" />
      <div className="orb orb--left" aria-hidden="true" />
      <div className="orb orb--right" aria-hidden="true" />

      <motion.section
        className="login-wrap"
        initial={{ opacity: 0, y: 26, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="login-glow" aria-hidden="true" />
        <div className="login-panel">
          <header className="brand">
            <div className="brand-mark">
              <img src={appLogo} alt="LetterCraft" />
            </div>
            <div>
              <p className="brand-name">LetterCraft</p>
              <p className="brand-caption">Корпоративные письма. Без лишних слов.</p>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="intro">
                  <p className="intro-kicker">Голос Вашего бизнеса</p>
                  <h1>Письма, которые читают</h1>
                  <p>Введите рабочий email — пришлём ссылку для входа. Без пароля.</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form" noValidate>
                  <label className="field-label" htmlFor="email">Рабочая почта</label>
                  <div className="input-shell">
                    <span className="input-icon"><MailIcon /></span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@tehgid.com"
                      autoComplete="email"
                      autoFocus
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        role="alert"
                        className="error-banner"
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="error-banner__icon"><AlertIcon /></span>
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    className="submit-button"
                    type="submit"
                    disabled={loading || !isValid}
                    whileHover={!loading && isValid ? { scale: 1.012 } : {}}
                    whileTap={!loading && isValid ? { scale: 0.985 } : {}}
                  >
                    <span>{loading ? "Отправляем..." : "Получить ссылку"}</span>
                    {loading ? <span className="loader" aria-hidden="true" /> : <ArrowRight />}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="sent"
                className="sent-state"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="sent-state__icon"><CheckIcon /></div>
                <h2>Ссылка отправлена</h2>
                <p>
                  Проверьте почтовый ящик{" "}
                  <strong>{email}</strong>. Ссылка для входа действительна 15 минут.
                </p>
                {devLink && (
                  <div className="dev-link-box" role="region" aria-label="Ссылка для входа">
                    <div className="dev-link-box__label">
                      <span className="dev-pill">DEV</span>
                      SMTP не настроен — ссылка для копирования
                    </div>
                    <div className="dev-link-box__url" title={devLink}>
                      {devLink}
                    </div>
                    <div className="dev-link-box__actions">
                      <a
                        href={devLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dev-link-btn dev-link-btn--primary"
                      >
                        <ArrowRight />
                        Открыть
                      </a>
                      <button
                        type="button"
                        onClick={copyLink}
                        className="dev-link-btn dev-link-btn--secondary"
                      >
                        {copied ? <CheckIcon /> : <CopyIcon />}
                        {copied ? "Скопировано" : "Скопировать"}
                      </button>
                    </div>
                  </div>
                )}
                <button type="button" className="link-button" onClick={reset}>
                  Указать другой email
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="footer-hint">
            Доступ только для сотрудников @tehgid.com
          </p>
        </div>
      </motion.section>

      <p className="footer-note">Защищённое пространство LetterCraft</p>
    </main>
  );
}
