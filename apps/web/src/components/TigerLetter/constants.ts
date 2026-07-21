import type { AppState } from "./types";

export const COLORS = {
  pageBorder: "rgba(255, 255, 255, 0.10)",
  panelLine: "rgba(255, 255, 255, 0.06)",
  toolbarBg: "rgba(44, 37, 66, 0.58)",
  toolbarBorder: "rgba(255, 255, 255, 0.10)",
  white: "rgba(255, 255, 255, 0.94)",
  accent: "#F18F50",
  softText: "#8D8797",
  primaryGradient: "linear-gradient(180deg, #F18F50 0%, #EDCAB2 100%)",
  cardBg: "rgba(44, 37, 66, 0.58)",
  background: "#121027",
  sidebarBorder: "rgba(255, 255, 255, 0.10)",
};

export const DEFAULT_REQUISITES = `ООО «ТехноГид»
190020, Россия, г. Санкт-Петербург
Дерптский переулок, д. 13, литер А, пом. 1Н
ИНН: 7839127272 КПП: 783901001 ОГРН: 1207800047730
Р/с: 40702810532030004071
ФИЛИАЛ «САНКТ-ПЕТЕРБУРГСКИЙ» АО «АЛЬФА-БАНК»
БИК: 044030786  К/с: 30101810600000000786`;

export const DEFAULT_BODY = `<p>Уважаемые коллеги!</p>
<p>Направляем вам коммерческое предложение и информацию по возможным вариантам сотрудничества. Ниже можно описать состав решения, сроки, стоимость, обязательства сторон и иные условия.</p>
<p>При необходимости вы можете добавить маркированные или нумерованные списки, а также локально форматировать любые фрагменты текста — только выделенный текст, без влияния на остальные элементы документа.</p>`;

export const APP_ICON =
  "data:image/png;base64,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";

export const initialState: AppState = {
  headerSrc: null,
  footerSrc: null,
  logoSrc: null,
  stampSrc: null,
  signatureSrc: null,
  date: new Date().toISOString().slice(0, 10),
  letterNumber: "",
  numberFormat: "№ {number}",
  showDate: true,
  showNumber: true,
  senderOrg: "ООО «ТехноГид»",
  senderFio: "Семин В.Е.",
  recipientOrg: "",
  recipientFio: "",
  requisites: DEFAULT_REQUISITES,
  title: "Коммерческое предложение",
  bodyHtml: DEFAULT_BODY,
  signerRole: "Директор по продажам",
  signerName: "Семин В.Е.",
  selectedFont: "Involve",
  selectedFontSize: 14,
  selectedColor: "#22324D",
  exportFormat: "PDF",
  drafts: [
    { id: "d1", name: "КП / Базовый шаблон", savedAt: new Date().toISOString() },
    { id: "d2", name: "КП / Медицинский сектор", savedAt: new Date().toISOString() },
  ],
  formatPresetSavedAt: null,
};
