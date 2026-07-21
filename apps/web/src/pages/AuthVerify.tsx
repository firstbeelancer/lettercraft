import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { api, setToken } from "@/lib/api";
import appLogo from "@/assets/logo-white.png";

export default function AuthVerify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = params.get("token") || "";
    if (!token) {
      setStatus("error");
      setError("Ссылка не содержит токен");
      return;
    }
    (async () => {
      try {
        const { token: jwt, user } = await api.verifyToken(token);
        setToken(jwt);
        setStatus("ok");
        setTimeout(() => navigate("/", { replace: true }), 700);
      } catch (err: any) {
        setStatus("error");
        setError(
          err?.message === "invalid_or_expired_token"
            ? "Ссылка устарела или уже использована. Запросите новую."
            : err?.message || "Ошибка входа"
        );
      }
    })();
  }, [params, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#121027",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Involve', 'Inter', -apple-system, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-10%",
          left: "25%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(241,143,80,0.18) 0%, transparent 65%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          position: "relative",
          zIndex: 1,
          padding: 36,
          borderRadius: 24,
          background: "rgba(28, 23, 48, 0.55)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            margin: "0 auto 20px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <img
            src={appLogo}
            alt="LetterCraft"
            style={{ width: 36, height: 36, borderRadius: 10, objectFit: "contain" }}
          />
        </div>

        {status === "pending" && (
          <>
            <div
              style={{
                width: 48,
                height: 48,
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Loader2
                size={36}
                strokeWidth={1.8}
                color="#F18F50"
                style={{ animation: "spin 0.8s linear infinite" }}
              />
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "rgba(255,255,255,0.94)",
                letterSpacing: "-0.01em",
              }}
            >
              Входим в LetterCraft
            </h2>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 13,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Проверяем magic link…
            </p>
          </>
        )}

        {status === "ok" && (
          <>
            <div
              style={{
                width: 64,
                height: 64,
                margin: "0 auto 20px",
                borderRadius: "50%",
                background:
                  "linear-gradient(180deg, rgba(241,143,80,0.20) 0%, rgba(237,202,178,0.10) 100%)",
                border: "1px solid rgba(241,143,80,0.30)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "scaleIn 0.3s ease",
              }}
            >
              <Check size={32} strokeWidth={2.5} color="#F18F50" />
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "rgba(255,255,255,0.96)",
                letterSpacing: "-0.01em",
              }}
            >
              Вход выполнен
            </h2>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.5,
              }}
            >
              Перенаправляем в конструктор…
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div
              style={{
                width: 64,
                height: 64,
                margin: "0 auto 20px",
                borderRadius: "50%",
                background:
                  "linear-gradient(180deg, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0.08) 100%)",
                border: "1px solid rgba(239,68,68,0.30)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "scaleIn 0.3s ease",
              }}
            >
              <AlertCircle size={32} strokeWidth={2.2} color="#f87171" />
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "rgba(255,255,255,0.96)",
                letterSpacing: "-0.01em",
              }}
            >
              Не удалось войти
            </h2>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.5,
              }}
            >
              {error}
            </p>
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              style={{
                marginTop: 24,
                padding: "12px 20px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(180deg, #F18F50 0%, #EDCAB2 100%)",
                color: "#121027",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "inherit",
                boxShadow:
                  "0 8px 24px rgba(241,143,80,0.25), inset 0 1px 0 rgba(255,255,255,0.3)",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              Запросить новую ссылку
              <ArrowRight size={16} strokeWidth={2.2} />
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
