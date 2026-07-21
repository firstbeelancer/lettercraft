import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "rgba(44, 37, 66, 0.92)",
          "--normal-text": "rgba(255,255,255,0.94)",
          "--normal-border": "rgba(255,255,255,0.10)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
