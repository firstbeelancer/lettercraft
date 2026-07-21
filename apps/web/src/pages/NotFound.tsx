import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

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
      <div style={{ textAlign: "center", color: "rgba(255,255,255,0.94)" }}>
        <h1 style={{ fontSize: 64, fontWeight: 800, color: "#F18F50", margin: 0 }}>404</h1>
        <p style={{ fontSize: 18, marginTop: 12 }}>Страница не найдена</p>
        <a
          href="/"
          style={{
            display: "inline-block",
            marginTop: 20,
            color: "#F18F50",
            textDecoration: "underline",
          }}
        >
          Вернуться в конструктор
        </a>
      </div>
    </div>
  );
};

export default NotFound;
