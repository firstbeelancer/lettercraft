import { useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "lettercraft.pwa.dismissed.v1";

export default function PwaInstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !evt || dismissed) return null;

  const install = async () => {
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
      }
    } finally {
      setEvt(null);
    }
  };

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* noop */
    }
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        maxWidth: 480,
        margin: "0 auto",
        padding: 16,
        borderRadius: 16,
        background: "rgba(44, 37, 66, 0.92)",
        backdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        color: "rgba(255,255,255,0.94)",
        fontFamily: "'Involve', 'Inter', sans-serif",
        zIndex: 1000,
        display: "flex",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div style={{ fontSize: 28 }}>📲</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
          Установить LetterCraft
        </div>
        <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", lineHeight: 1.4 }}>
          Можно добавить на главный экран телефона — будет работать как обычное приложение.
        </div>
      </div>
      <button
        type="button"
        onClick={install}
        style={{
          padding: "8px 14px",
          borderRadius: 10,
          border: "none",
          background: "linear-gradient(180deg, #F18F50 0%, #EDCAB2 100%)",
          color: "#121027",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        Установить
      </button>
      <button
        type="button"
        onClick={close}
        aria-label="Закрыть"
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.6)",
          fontSize: 20,
          lineHeight: 1,
          cursor: "pointer",
          padding: 4,
        }}
      >
        ×
      </button>
    </div>
  );
}
