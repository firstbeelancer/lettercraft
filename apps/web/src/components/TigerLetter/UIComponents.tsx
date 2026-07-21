import React, { CSSProperties, useState } from "react";

const toolbarIconButtonStyle: CSSProperties = {
  width: 44,
  height: 44,
  display: "grid",
  placeItems: "center",
  borderRadius: 999,
  border: "1px solid rgba(255, 255, 255, 0.08)",
  background: "rgba(255, 255, 255, 0.06)",
  color: "rgba(255, 255, 255, 0.92)",
  cursor: "pointer",
  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.06)",
  transition: "transform 0.18s ease, box-shadow 0.18s ease",
};

export function HoverIconButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...toolbarIconButtonStyle,
        transform: hovered ? "translateY(-2px) scale(1.05)" : "translateY(0)",
        boxShadow: hovered
          ? "0 0 24px rgba(241, 143, 80, 0.35), 0 0 56px rgba(241, 143, 80, 0.18)"
          : "inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        background: hovered
          ? "rgba(241, 143, 80, 0.15)"
          : "rgba(255, 255, 255, 0.06)",
      }}
    >
      {children}
    </button>
  );
}

export function GlowButton({
  children,
  onClick,
  danger = false,
  primary = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  primary?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 14px",
    borderRadius: 999,
    border: `1px solid ${
      danger
        ? "rgba(239, 68, 68, 0.3)"
        : primary
        ? "rgba(241, 143, 80, 0.4)"
        : "rgba(255, 255, 255, 0.08)"
    }`,
    background: danger
      ? "rgba(239, 68, 68, 0.12)"
      : primary
      ? "linear-gradient(180deg, #F18F50 0%, #EDCAB2 100%)"
      : "linear-gradient(180deg, rgba(103, 96, 130, 0.35) 0%, rgba(63, 58, 92, 0.28) 100%)",
    color: danger
      ? "#ef4444"
      : primary
      ? "#121027"
      : "rgba(255, 255, 255, 0.92)",
    fontSize: 12,
    fontWeight: 500,
    boxShadow: danger
      ? hovered
        ? "0 0 16px rgba(239, 68, 68, 0.3)"
        : "var(--shadow-soft)"
      : primary
      ? hovered
        ? "var(--shadow-glow-strong)"
        : "var(--shadow-glow)"
      : hovered
      ? "0 0 16px rgba(241, 143, 80, 0.2)"
      : "inset 0 1px 0 rgba(255, 255, 255, 0.06)",
    cursor: "pointer",
    transform: hovered ? "translateY(-2px) scale(1.02)" : "translateY(0)",
    transition: "transform 0.18s ease, box-shadow 0.18s ease",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={style}
    >
      {children}
    </button>
  );
}

export function PanelSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginBottom: 16,
        padding: 16,
        borderRadius: 24,
        border: "1px solid rgba(255, 255, 255, 0.06)",
        background: "rgba(255, 255, 255, 0.05)",
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 34,
            height: 34,
            display: "grid",
            placeItems: "center",
            borderRadius: 999,
            background: "linear-gradient(180deg, #F18F50 0%, #EDCAB2 100%)",
            color: "#121027",
            boxShadow: "0 0 24px rgba(241, 143, 80, 0.35), 0 0 56px rgba(241, 143, 80, 0.18)",
          }}
        >
          {icon}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255, 255, 255, 0.94)", letterSpacing: "-0.01em" }}>
          {title}
        </div>
      </div>
      {children}
    </section>
  );
}

export function LabeledField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#F18F50",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

export const PremiumInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function PremiumInput(props, ref) {
  return (
    <input
      {...props}
      ref={ref}
      style={{
        width: "100%",
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid rgba(255, 255, 255, 0.08)",
        background: "rgba(44, 37, 66, 0.58)",
        color: "rgba(255, 255, 255, 0.94)",
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
        ...(props.style || {}),
      }}
    />
  );
});

export function PremiumSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid rgba(255, 255, 255, 0.08)",
        background: "rgba(44, 37, 66, 0.58)",
        color: "rgba(255, 255, 255, 0.94)",
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
        ...(props.style || {}),
      }}
    />
  );
}
