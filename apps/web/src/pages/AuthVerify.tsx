import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
        // небольшая пауза, чтобы юзер увидел успех
        setTimeout(() => navigate("/", { replace: true }), 600);
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Involve', 'Inter', sans-serif",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          padding: 32,
          borderRadius: 24,
          background: "rgba(44, 37, 66, 0.58)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.10)",
          textAlign: "center",
        }}
      >
        <img
          src={appLogo}
          alt="LetterCraft"
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            margin: "0 auto 16px",
            filter: "drop-shadow(0 0 18px rgba(241,143,80,0.5))",
          }}
        />
        {status === "pending" && (
          <>
            <p style={{ color: "rgba(255,255,255,0.94)", fontSize: 18, fontWeight: 600 }}>
              Входим в LetterCraft…
            </p>
            <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13, marginTop: 8 }}>
              Проверяем magic link
            </p>
          </>
        )}
        {status === "ok" && (
          <>
            <p style={{ fontSize: 40, marginBottom: 8 }}>✅</p>
            <p style={{ color: "rgba(255,255,255,0.94)", fontSize: 18, fontWeight: 600 }}>
              Вход выполнен
            </p>
            <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13, marginTop: 8 }}>
              Перенаправляем в конструктор…
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <p style={{ fontSize: 40, marginBottom: 8 }}>⚠️</p>
            <p style={{ color: "rgba(255,255,255,0.94)", fontSize: 18, fontWeight: 600 }}>
              Не удалось войти
            </p>
            <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</p>
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              style={{
                marginTop: 20,
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(180deg, #F18F50 0%, #EDCAB2 100%)",
                color: "#121027",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Запросить новую ссылку
            </button>
          </>
        )}
      </div>
    </div>
  );
}
