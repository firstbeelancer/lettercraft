import { useToast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts } = useToast();
  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 360,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            background: "rgba(44, 37, 66, 0.92)",
            color: "rgba(255,255,255,0.94)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            fontSize: 13,
            backdropFilter: "blur(12px)",
          }}
        >
          {t.title && <div style={{ fontWeight: 700 }}>{t.title}</div>}
          {t.description && <div style={{ marginTop: 4 }}>{t.description}</div>}
        </div>
      ))}
    </div>
  );
}
