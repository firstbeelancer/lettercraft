import { useState } from "react";
import { api } from "@/lib/api";
import appLogo from "@/assets/logo-white.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.requestMagicLink(email.trim().toLowerCase());
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Ошибка отправки. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

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
          position: "fixed",
          top: "20%",
          left: "30%",
          width: 400,
          height: 400,
          background:
            "radial-gradient(circle, rgba(241,143,80,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 420,
          padding: 40,
          borderRadius: 24,
          background: "rgba(44, 37, 66, 0.58)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src={appLogo}
            alt="LetterCraft"
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              margin: "0 auto 16px",
              filter:
                "drop-shadow(0 0 18px rgba(241,143,80,0.5)) drop-shadow(0 0 40px rgba(241,143,80,0.25))",
            }}
          />
          <h1
            style={{
              color: "rgba(255,255,255,0.94)",
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
            }}
          >
            LetterCraft
          </h1>
          <p
            style={{
              color: "hsl(var(--muted-foreground))",
              fontSize: 14,
              marginTop: 8,
            }}
          >
            Войдите по Magic Link
          </p>
        </div>

        {sent ? (
          <div
            style={{
              textAlign: "center",
              padding: 20,
              borderRadius: 16,
              background: "rgba(241,143,80,0.1)",
              border: "1px solid rgba(241,143,80,0.2)",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
            <p
              style={{
                color: "rgba(255,255,255,0.94)",
                fontSize: 16,
                fontWeight: 600,
                margin: "0 0 8px",
              }}
            >
              Ссылка отправлена!
            </p>
            <p
              style={{
                color: "hsl(var(--muted-foreground))",
                fontSize: 13,
                margin: 0,
              }}
            >
              Проверьте почту{" "}
              <strong style={{ color: "#F18F50" }}>{email}</strong> и перейдите
              по ссылке для входа.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                display: "block",
              }}
            >
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@tehgid.com"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.94)",
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 16,
                transition: "border-color 0.2s",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "rgba(241,143,80,0.5)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")
              }
            />

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  marginBottom: 16,
                  background: "rgba(220,50,50,0.12)",
                  border: "1px solid rgba(220,50,50,0.25)",
                  color: "#f87171",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 12,
                border: "none",
                background: loading
                  ? "rgba(241,143,80,0.4)"
                  : "linear-gradient(180deg, #F18F50 0%, #EDCAB2 100%)",
                color: "#121027",
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Отправка..." : "Получить Magic Link"}
            </button>

            <p
              style={{
                color: "hsl(var(--muted-foreground))",
                fontSize: 12,
                marginTop: 16,
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              Доступ только для сотрудников из списка. Если ваш email не
              добавлен — обратитесь к администратору.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
