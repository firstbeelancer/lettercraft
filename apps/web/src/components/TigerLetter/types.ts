export type ExportFormat = "PDF" | "JSON" | "PNG";
export type FontFamily = "Arimo" | "Involve" | "Evolventa";
export type SelectedObject = "stamp" | "signature" | null;

export type DraftMeta = {
  id: string;
  name: string;
  savedAt: string;
};

export type AppState = {
  headerSrc: string | null;
  footerSrc: string | null;
  logoSrc: string | null;
  stampSrc: string | null;
  signatureSrc: string | null;

  date: string;
  letterNumber: string;
  numberFormat: string;
  showDate: boolean;
  showNumber: boolean;

  senderOrg: string;
  senderFio: string;
  recipientOrg: string;
  recipientFio: string;
  requisites: string;

  title: string;
  bodyHtml: string;

  signerRole: string;
  signerName: string;

  selectedFont: FontFamily;
  selectedFontSize: number;
  selectedColor: string;

  exportFormat: ExportFormat;
  drafts: DraftMeta[];
  formatPresetSavedAt: string | null;
};

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type DragState = {
  target: Exclude<SelectedObject, null>;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};
