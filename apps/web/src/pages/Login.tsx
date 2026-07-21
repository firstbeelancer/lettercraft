import { useState } from "react";
import { Mail, ArrowRight, Check, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import appLogo from "@/assets/logo-white.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail) {
      setError("Введите корректный email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.requestMagicLink(email.trim().toLowerCase());
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Не удалось отправить ссылку. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

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
      {/* Background — gradient orbs + subtle grid */}
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
          top: "-15%",
          left: "20%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(241,143,80,0.18) 0%, transparent 65%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "10%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(241,143,80,0.10) 0%, transparent 65%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo + brand */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              position: "relative",
              width: 72,
              height: 72,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: -8,
                borderRadius: 24,
                background:
                  "radial-gradient(circle, rgba(241,143,80,0.35) 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
            />
            <img
              src={appLogo}
              alt="LetterCraft"
              style={{
                position: "relative",
                width: 72,
                height: 72,
                borderRadius: 18,
                objectFit: "contain",
                boxShadow:
                  "0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
              }}
            />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "rgba(255,255,255,0.96)",
              lineHeight: 1.1,
            }}
          >
            LetterCraft
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 14,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.01em",
            }}
          >
            Конструктор корпоративных писем
          </p>
        </div>

        {/* Glass card */}
        <div
          style={{
            padding: 32,
            borderRadius: 24,
            background: "rgba(28, 23, 48, 0.55)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {sent ? (
            <SentState email={email} onReset={() => {
              setSent(false);
              setEmail("");
              setError("");
            }} />
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.94)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Войти по Magic Link
                </h2>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.55)",
                    lineHeight: 1.5,
                  }}
                >
                  Введите рабочий email — пришлём ссылку для входа.
                  Без пароля.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                {/* Email input */}
                <div
                  style={{
                    position: "relative",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      display: "flex",
                      alignItems: "center",
                      color: focused || email ? "#F18F50" : "rgba(255,255,255,0.4)",
                      transition: "color 0.2s",
                      pointerEvents: "none",
                    }}
                  >
                    <Mail size={18} strokeWidth={1.8} />
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="you@tehgid.com"
                    style={{
                      width: "100%",
                      padding: "14px 16px 14px 44px",
                      borderRadius: 14,
                      border: `1px solid ${
                        error
                          ? "rgba(239,68,68,0.4)"
                          : focused
                          ? "rgba(241,143,80,0.5)"
                          : "rgba(255,255,255,0.08)"
                      }`,
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.96)",
                      fontSize: 15,
                      fontWeight: 400,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                      fontFamily: "inherit",
                      boxShadow: focused
                        ? "0 0 0 4px rgba(241,143,80,0.10)"
                        : "none",
                    }}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      marginBottom: 16,
                      animation: "fadeIn 0.2s ease",
                    }}
                  >
                    <AlertCircle
                      size={16}
                      strokeWidth={2}
                      color="#f87171"
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    <div
                      style={{
                        fontSize: 13,
                        color: "#fca5a5",
                        lineHeight: 1.45,
                      }}
                    >
                      {error}
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || !isValidEmail}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: 14,
                    border: "none",
                    background:
                      loading || !isValidEmail
                        ? "rgba(241,143,80,0.25)"
                        : "linear-gradient(180deg, #F18F50 0%, #EDCAB2 100%)",
                    color: loading || !isValidEmail ? "rgba(255,255,255,0.6)" : "#121027",
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    cursor:
                      loading || !isValidEmail ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontFamily: "inherit",
                    boxShadow:
                      loading || !isValidEmail
                        ? "none"
                        : "0 8px 24px rgba(241,143,80,0.25), inset 0 1px 0 rgba(255,255,255,0.3)",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && isValidEmail) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow =
                        "0 12px 32px rgba(241,143,80,0.35), inset 0 1px 0 rgba(255,255,255,0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    if (!loading && isValidEmail) {
                      e.currentTarget.style.boxShadow =
                        "0 8px 24px rgba(241,143,80,0.25), inset 0 1px 0 rgba(255,255,255,0.3)";
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        strokeWidth={2.2}
                        style={{ animation: "spin 0.8s linear infinite" }}
                      />
                      Отправляем...
                    </>
                  ) : (
                    <>
                      Получить ссылку
                      <ArrowRight size={18} strokeWidth={2.2} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
          }}
        >
          <Sparkles size={12} strokeWidth={1.8} />
          <span>Доступ только для сотрудников @tehgid.com</span>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

function SentState({ email, onReset }: { email: string; onReset: () => void }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: 64,
          height: 64,
          margin: "0 auto 20px",
          borderRadius: "50%",
          background: "linear-gradient(180deg, rgba(241,143,80,0.20) 0%, rgba(237,202,178,0.10) 100%)",
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
        Ссылка отправлена
      </h2>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: 14,
          color: "rgba(255,255,255,0.6)",
          lineHeight: 1.55,
        }}
      >
        Проверьте почтовый ящик{" "}
        <strong
          style={{
            color: "rgba(255,255,255,0.92)",
            fontWeight: 600,
          }}
        >
          {email}
        </strong>
        . Ссылка для входа действительна 15 минут.
      </p>
      <button
        type="button"
        onClick={onReset}
        style={{
          marginTop: 24,
          padding: "10px 18px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "transparent",
          color: "rgba(255,255,255,0.7)",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          e.currentTarget.style.color = "rgba(255,255,255,0.92)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "rgba(255,255,255,0.7)";
        }}
      >
        Указать другой email
      </button>
    </div>
  );
}
