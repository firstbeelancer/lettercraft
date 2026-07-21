// Минимальный shadcn-style toast — нужен только для type-импорта.
// Реальные тосты рендерятся через @/components/ui/toaster.tsx
import * as React from "react";

export type ToastProps = {
  id?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "default" | "destructive";
};

export type ToastActionElement = React.ReactElement;
