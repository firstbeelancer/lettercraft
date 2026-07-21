import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { format, parse } from "date-fns";
import { ru } from "date-fns/locale";
import type { AppState, DraftMeta, ExportFormat, FontFamily, Rect, SelectedObject, DragState } from "./types";
import { COLORS, initialState, APP_ICON } from "./constants";
import { uid, clamp, formatDateRu, readFileAsDataUrl, splitHtmlIntoBlocks, downloadBlob } from "./utils";
import { Icons } from "./Icons";
import { HoverIconButton, GlowButton, PanelSection, LabeledField, PremiumInput, PremiumSelect } from "./UIComponents";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import appLogo from "@/assets/logo-white.png";
import { api, assetSrc, type ApiUser, type BrandAsset, type LetterSummary } from "@/lib/api";

type ServerDraftMeta = DraftMeta & { serverId?: string };

export default function TigerLetterCraft({
  user,
  onSignOut,
}: {
  user: ApiUser;
  onSignOut: () => Promise<void>;
}) {
  const [state, setState] = useState<AppState>(initialState);
  const [graphicMode, setGraphicMode] = useState(false);
  const [stampRect, setStampRect] = useState<Rect>({ x: 540, y: 920, w: 92, h: 92 });
  const [signatureRect, setSignatureRect] = useState<Rect>({ x: 390, y: 885, w: 170, h: 68 });
  const [selectedObject, setSelectedObject] = useState<SelectedObject>(null);
  const dragRef = useRef<DragState | null>(null);
  const [draftSavedToast, setDraftSavedToast] = useState<string | null>(null);
  const [showDrafts, setShowDrafts] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<"settings" | "preview">("preview");
  const [exporting, setExporting] = useState(false);

  const headerInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const bodyRef = useRef<HTMLDivElement>(null);
  const pageMeasureRef = useRef<HTMLDivElement>(null);
  const editorSelectionRef = useRef<HTMLElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [pages, setPages] = useState<string[]>([state.bodyHtml]);
  const [serverBrand, setServerBrand] = useState<Record<string, BrandAsset>>({});
  const [serverDrafts, setServerDrafts] = useState<LetterSummary[]>([]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // загрузить черновики и брендовые ассеты с сервера при входе
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [lettersResp, brandResp] = await Promise.all([
          api.listLetters(),
          api.listBrand(),
        ]);
        if (cancelled) return;
        setServerDrafts(lettersResp.letters);
        const brandMap: Record<string, BrandAsset> = {};
        brandResp.assets.forEach((a) => {
          brandMap[a.type] = a;
        });
        setServerBrand(brandMap);
        // Пре-заполним state.drafts черновиками с сервера и подгрузим последний активный бренд
        setState((prev) => {
          const serverAsDrafts: ServerDraftMeta[] = lettersResp.letters.map((l) => ({
            id: l.id,
            name: l.name,
            savedAt: l.updatedAt,
            serverId: l.id,
          }));
          const next = {
            ...prev,
            drafts: [
              ...serverAsDrafts,
              ...prev.drafts.filter(
                (d) => !d.id || !d.id.includes("-")
              ),
            ],
          };
          // Если у пользователя ещё не выбран бренд, но он есть на сервере — подставим
          const types: (keyof Pick<AppState, "headerSrc" | "footerSrc" | "logoSrc" | "stampSrc" | "signatureSrc">)[] = [
            "headerSrc",
            "footerSrc",
            "logoSrc",
            "stampSrc",
            "signatureSrc",
          ];
          types.forEach((k) => {
            if (!prev[k]) {
              const t = k.replace("Src", "");
              const a = brandMap[t];
              if (a) (next as any)[k] = assetSrc(a);
            }
          });
          return next;
        });
      } catch (err) {
        console.warn("load server data failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const formattedNumber = useMemo(() => {
    if (!state.letterNumber) return "";
    return state.numberFormat.replace("{number}", state.letterNumber);
  }, [state.letterNumber, state.numberFormat]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag || (drag.target !== "signature" && drag.target !== "stamp")) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (drag.target === "signature") {
        setSignatureRect((prev) => ({ ...prev, x: Math.max(0, drag.originX + dx), y: Math.max(0, drag.originY + dy) }));
        return;
      }
      setStampRect((prev) => ({ ...prev, x: Math.max(0, drag.originX + dx), y: Math.max(0, drag.originY + dy) }));
    };
    const onMouseUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!bodyRef.current || !pageMeasureRef.current) return;
      const blocks = splitHtmlIntoBlocks(state.bodyHtml);
      const editorWidth = bodyRef.current.clientWidth || 700;

      const makeMeasure = () => {
        const el = document.createElement("div");
        Object.assign(el.style, {
          position: "absolute", left: "-99999px", top: "-99999px", width: `${editorWidth}px`,
          visibility: "hidden",
          background: "#ffffff", padding: "18px",
          fontSize: `${state.selectedFontSize}px`, lineHeight: "1.6", color: state.selectedColor,
          fontFamily: state.selectedFont, boxSizing: "border-box",
        });
        pageMeasureRef.current!.innerHTML = "";
        pageMeasureRef.current!.appendChild(el);
        return el;
      };

      // First page has header (~110px), date/sender/recipient (~160px), title (~60px), footer (~48px), signer (~60px margin)
      // Total overhead on first page ~ 380px, A4 at 96dpi ≈ 1123px, so content area ≈ 740px
      // But we must also leave room for signer block + footer on last page
      const A4_HEIGHT_PX = 1123; // 297mm at 96dpi
      const FIRST_PAGE_OVERHEAD = 440; // header + date/sender/recipient + title + margins
      const FOOTER_HEIGHT = 80;
      const SIGNER_HEIGHT = 80;
      const PAGE_PADDING = 150; // top + bottom padding in mm converted

      const firstMax = A4_HEIGHT_PX - FIRST_PAGE_OVERHEAD - FOOTER_HEIGHT;
      const nextMax = A4_HEIGHT_PX - PAGE_PADDING - FOOTER_HEIGHT;

      const measureBox = makeMeasure();
      let idx = 0;
      const firstBlocks: string[] = [];
      while (idx < blocks.length) {
        const next = [...firstBlocks, blocks[idx]].join("");
        measureBox.innerHTML = next;
        if (measureBox.scrollHeight <= firstMax) { firstBlocks.push(blocks[idx]); idx += 1; } else { break; }
      }
      const result = [firstBlocks.join("") || "<p><br></p>"];

      while (idx < blocks.length) {
        const pageBlocks: string[] = [];
        // Last page needs signer space
        const isLikelyLast = idx + 5 >= blocks.length;
        const maxH = isLikelyLast ? nextMax - SIGNER_HEIGHT : nextMax;
        while (idx < blocks.length) {
          const next = [...pageBlocks, blocks[idx]].join("");
          measureBox.innerHTML = next;
          if (measureBox.scrollHeight <= maxH) { pageBlocks.push(blocks[idx]); idx += 1; } else { break; }
        }
        result.push(pageBlocks.join("") || "<p><br></p>");
      }
      setPages(result);
    }, 90);
    return () => clearTimeout(timer);
  }, [state.bodyHtml, state.selectedFont, state.selectedFontSize, state.selectedColor]);

  function patch<K extends keyof AppState>(key: K, value: AppState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  async function handleUpload<K extends keyof Pick<AppState, "headerSrc" | "footerSrc" | "logoSrc" | "stampSrc" | "signatureSrc">>(file: File | undefined, key: K) {
    if (!file) return;
    const type = key.replace("Src", "") as "header" | "footer" | "logo" | "stamp" | "signature";
    try {
      const { asset } = await api.uploadBrand(type, file);
      patch(key, (asset.dataUrl || asset.url) as AppState[K]);
    } catch (err) {
      console.error("upload brand failed", err);
      // fallback: data URL, чтобы можно было продолжать работу офлайн
      const src = await readFileAsDataUrl(file);
      patch(key, src as AppState[K]);
      setDraftSavedToast("Не удалось загрузить на сервер, сохранено локально");
      setTimeout(() => setDraftSavedToast(null), 2000);
    }
  }

  function applyCommand(command: string, value?: string) {
    editorSelectionRef.current?.focus();
    try { document.execCommand(command, false, value); } catch { /* noop */ }
    if (bodyRef.current) patch("bodyHtml", bodyRef.current.innerHTML);
  }

  async function saveDraft() {
    const title = state.title || "Черновик";
    try {
      const { letter } = await api.createLetter({
        name: title,
        title: state.title,
        isDraft: true,
        state,
      });
      setState((prev) => ({
        ...prev,
        drafts: [
          { id: letter.id, name: letter.name, savedAt: letter.updatedAt } as ServerDraftMeta,
          ...prev.drafts,
        ],
      }));
      setDraftSavedToast("Черновик сохранён на сервере");
    } catch (err) {
      console.error("save draft failed", err);
      const next: DraftMeta = { id: uid(), name: title, savedAt: new Date().toISOString() };
      setState((prev) => ({ ...prev, drafts: [next, ...prev.drafts] }));
      setDraftSavedToast("Сервер недоступен, сохранено локально");
    }
    setTimeout(() => setDraftSavedToast(null), 1800);
  }

  async function loadDraftFromServer(draft: ServerDraftMeta) {
    if (!draft.id) return;
    try {
      const { letter } = await api.getLetter(draft.id);
      setState((prev) => ({ ...prev, ...(letter.state as AppState) }));
      setDraftSavedToast(`Загружено: ${letter.name}`);
    } catch {
      setDraftSavedToast("Не удалось загрузить черновик");
    }
    setTimeout(() => setDraftSavedToast(null), 1800);
  }

  function deleteDraft(draft: ServerDraftMeta) {
    setState((prev) => ({
      ...prev,
      drafts: prev.drafts.filter((d) => d.id !== draft.id),
    }));
    if (draft.serverId) {
      api.deleteLetter(draft.serverId).catch(() => {});
    }
  }

  function saveFormattingSettings() {
    patch("formatPresetSavedAt", new Date().toISOString());
    setDraftSavedToast("Настройки форматирования сохранены");
    setTimeout(() => setDraftSavedToast(null), 1800);
  }

  function startDrag(target: SelectedObject, e: React.MouseEvent<HTMLImageElement | HTMLDivElement>) {
    if (!graphicMode || !target) return;
    e.preventDefault(); e.stopPropagation();
    const dragTarget = target as Exclude<SelectedObject, null>;
    setSelectedObject(dragTarget);
    dragRef.current = {
      target: dragTarget, startX: e.clientX, startY: e.clientY,
      originX: dragTarget === "signature" ? signatureRect.x : stampRect.x,
      originY: dragTarget === "signature" ? signatureRect.y : stampRect.y,
    };
  }

  function openDatePicker() {
    const input = dateInputRef.current;
    if (!input) return;
    try { input.focus(); input.click(); } catch { input.focus(); }
  }

  const exportCurrent = useCallback(async () => {
    if (state.exportFormat === "JSON") {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json;charset=utf-8" });
      downloadBlob(`letter-${uid()}.json`, blob);
      return;
    }
    const container = previewContainerRef.current;
    if (!container) return;
    setExporting(true);

    // Wait a tick for exporting state to apply (hides placeholders)
    await new Promise((r) => setTimeout(r, 100));

    try {
      const pageEls = container.querySelectorAll<HTMLElement>("[data-page]");

      // Hide data-export-hide elements
      const hiddenEls: HTMLElement[] = [];
      pageEls.forEach((p) => {
        p.querySelectorAll<HTMLElement>("[data-export-hide]").forEach((el) => {
          hiddenEls.push(el);
          el.style.display = "none";
        });
      });

      // Strip container decorations (borders, backgrounds, border-radius) for clean export
      const strippedContainers: { el: HTMLElement; border: string; bg: string; radius: string; shadow: string }[] = [];
      pageEls.forEach((p) => {
        p.querySelectorAll<HTMLElement>("[data-export-container]").forEach((el) => {
          strippedContainers.push({ el, border: el.style.border, bg: el.style.background, radius: el.style.borderRadius, shadow: el.style.boxShadow });
          el.style.border = "none";
          el.style.background = "transparent";
          el.style.borderRadius = "0";
          el.style.boxShadow = "none";
        });
      });

      // Also strip body content border
      const strippedBodies: { el: HTMLElement; border: string; radius: string }[] = [];
      pageEls.forEach((p) => {
        p.querySelectorAll<HTMLDivElement>("[contenteditable]").forEach((el) => {
          if (el.style.border && el.closest("[data-page]") === p) {
            strippedBodies.push({ el, border: el.style.border, radius: el.style.borderRadius });
            el.style.border = "none";
            el.style.borderRadius = "0";
          }
        });
      });

      if (state.exportFormat === "PNG") {
        const canvases: HTMLCanvasElement[] = [];
        for (const pageEl of pageEls) {
          const canvas = await html2canvas(pageEl, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
          canvases.push(canvas);
        }
        const totalHeight = canvases.reduce((s, c) => s + c.height, 0);
        const maxWidth = Math.max(...canvases.map((c) => c.width));
        const merged = document.createElement("canvas");
        merged.width = maxWidth;
        merged.height = totalHeight;
        const ctx = merged.getContext("2d")!;
        let y = 0;
        for (const c of canvases) { ctx.drawImage(c, 0, y); y += c.height; }
        merged.toBlob((blob) => { if (blob) downloadBlob(`letter-${uid()}.png`, blob); }, "image/png");
      } else {
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        let first = true;
        for (const pageEl of pageEls) {
          const canvas = await html2canvas(pageEl, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
          const imgData = canvas.toDataURL("image/png");
          if (!first) pdf.addPage();
          first = false;
          // Calculate proportional height to avoid squishing
          const imgW = canvas.width;
          const imgH = canvas.height;
          const pdfW = 210;
          const pdfH = (imgH / imgW) * pdfW;
          pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
        }
        pdf.save(`letter-${uid()}.pdf`);
      }

      // Restore hidden elements
      hiddenEls.forEach((el) => { el.style.display = ""; });
      // Restore container styles
      strippedContainers.forEach(({ el, border, bg, radius, shadow }) => {
        el.style.border = border;
        el.style.background = bg;
        el.style.borderRadius = radius;
        el.style.boxShadow = shadow;
      });
      strippedBodies.forEach(({ el, border, radius }) => {
        el.style.border = border;
        el.style.borderRadius = radius;
      });
    } catch (err) {
      console.error("Export error:", err);
      setDraftSavedToast("Ошибка экспорта");
      setTimeout(() => setDraftSavedToast(null), 2000);
    } finally {
      setExporting(false);
    }
  }, [state]);

  const sidebarContent = (
    <div style={{ padding: 18, overflowY: "auto", maxHeight: isMobile ? "none" : "calc(100vh - 220px)" }}>
      {/* Section 1: Brand artifacts */}
      <PanelSection title="Брендовые артефакты" icon={Icons.image}>
        <div style={{ display: "grid", gap: 10 }}>
          {(["header", "footer", "logo"] as const).map((t) => {
            const serverHas = !!serverBrand[t];
            const labels: Record<string, [string, string, string]> = {
              header: ["Загрузить шапку", "Удалить шапку", "headerSrc"],
              footer: ["Загрузить футтер", "Удалить футтер", "footerSrc"],
              logo: ["Загрузить лого", "Удалить лого", "logoSrc"],
            };
            const [addLabel, delLabel, key] = labels[t];
            const ref =
              t === "header" ? headerInputRef : t === "footer" ? footerInputRef : logoInputRef;
            return (
              <React.Fragment key={t}>
                <GlowButton onClick={() => ref.current?.click()}>
                  {Icons.upload} {addLabel} {serverHas ? "(на сервере)" : ""}
                </GlowButton>
                <GlowButton
                  danger
                  onClick={async () => {
                    patch(key as any, null);
                    const a = serverBrand[t];
                    if (a) {
                      try {
                        await api.deleteBrand(a.id);
                        setServerBrand((prev) => {
                          const next = { ...prev };
                          delete next[t];
                          return next;
                        });
                      } catch (err) {
                        console.warn("delete brand failed", err);
                      }
                    }
                  }}
                >
                  {Icons.trash} {delLabel}
                </GlowButton>
              </React.Fragment>
            );
          })}
        </div>
        <input ref={headerInputRef} type="file" accept=".svg,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={(e) => handleUpload(e.target.files?.[0], "headerSrc")} />
        <input ref={footerInputRef} type="file" accept=".svg,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={(e) => handleUpload(e.target.files?.[0], "footerSrc")} />
        <input ref={logoInputRef} type="file" accept=".svg,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={(e) => handleUpload(e.target.files?.[0], "logoSrc")} />
      </PanelSection>

      {/* Section 2: Requisites */}
      <PanelSection title="Реквизиты компании" icon={Icons.settings}>
        <LabeledField label="Текст реквизитов">
          <textarea value={state.requisites} onChange={(e) => patch("requisites", e.target.value)} rows={8}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(44,37,66,0.58)", color: "rgba(255,255,255,0.94)", fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical", lineHeight: 1.5, whiteSpace: "pre-wrap" }}
            placeholder="Введите реквизиты" />
        </LabeledField>
      </PanelSection>

      {/* Section 3: Date & Number */}
      <PanelSection title="Дата и номер письма" icon={Icons.calendar}>
        <LabeledField label="Дата">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 44px", gap: 8 }}>
            <PremiumInput readOnly value={state.date ? formatDateRu(state.date) : ""} placeholder="Выберите дату" />
            <Popover>
              <PopoverTrigger asChild>
                <div><HoverIconButton title="Календарь">{Icons.calendar}</HoverIconButton></div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none" align="start" style={{ zIndex: 300, background: "rgba(23,18,48,0.95)", backdropFilter: "blur(18px)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
                <Calendar
                  mode="single"
                  selected={state.date ? parse(state.date, "yyyy-MM-dd", new Date()) : undefined}
                  onSelect={(d) => { if (d) patch("date", format(d, "yyyy-MM-dd")); }}
                  locale={ru}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  classNames={{
                    caption_label: "text-sm font-semibold text-white/90",
                    nav_button: cn(buttonVariants({ variant: "ghost" }), "h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/10 border-none"),
                    head_cell: "text-[hsl(var(--primary))] rounded-md w-9 font-semibold text-[0.75rem] uppercase",
                    day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal text-white/80 hover:bg-white/10 hover:text-white aria-selected:opacity-100 border-none"),
                    day_selected: "bg-[hsl(var(--primary))] text-[#121027] hover:bg-[hsl(var(--primary))] hover:text-[#121027] focus:bg-[hsl(var(--primary))] focus:text-[#121027] font-bold",
                    day_today: "bg-[hsl(var(--primary))/0.2] text-[hsl(var(--primary))] font-bold",
                    day_outside: "day-outside text-white/20 opacity-50",
                    day_disabled: "text-white/20 opacity-50",
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </LabeledField>
        <LabeledField label="Номер письма">
          <PremiumInput value={state.letterNumber} onChange={(e) => patch("letterNumber", e.target.value)} placeholder="Например 14/КП-2026" />
        </LabeledField>
        <LabeledField label="Формат номера">
          <PremiumInput value={state.numberFormat} onChange={(e) => patch("numberFormat", e.target.value)} placeholder="№ {number}" />
        </LabeledField>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <GlowButton danger onClick={() => { patch("showDate", false); patch("showNumber", false); }}>{Icons.trash} Удалить дату и номер</GlowButton>
          <GlowButton onClick={() => { patch("showDate", true); patch("showNumber", false); }}>{Icons.calendar} Добавить только дату</GlowButton>
          <GlowButton onClick={() => { patch("showDate", true); patch("showNumber", true); }}>{Icons.calendar} Добавить дату и номер</GlowButton>
        </div>
      </PanelSection>

      {/* Section 4: Formatting */}
      <PanelSection title="Форматирование текста" icon={Icons.type}>
        <LabeledField label="Шрифт">
          <PremiumSelect value={state.selectedFont} onChange={(e) => patch("selectedFont", e.target.value as FontFamily)}>
            <option>Arimo</option><option>Involve</option><option>Evolventa</option>
          </PremiumSelect>
        </LabeledField>
        <LabeledField label="Размер шрифта">
          <PremiumInput type="number" min={10} max={24} value={state.selectedFontSize} onChange={(e) => patch("selectedFontSize", clamp(Number(e.target.value) || 14, 10, 24))} />
        </LabeledField>
        <LabeledField label="Цвет текста">
          <div style={{ display: "grid", gridTemplateColumns: "52px 1fr", gap: 8 }}>
            <input type="color" value={state.selectedColor} onChange={(e) => patch("selectedColor", e.target.value)} style={{ width: 52, height: 44, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, background: "rgba(44,37,66,0.58)" }} />
            <PremiumInput value={state.selectedColor} onChange={(e) => patch("selectedColor", e.target.value)} />
          </div>
        </LabeledField>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <HoverIconButton title="Жирный" onClick={() => applyCommand("bold")}>{Icons.bold}</HoverIconButton>
            <HoverIconButton title="Курсив" onClick={() => applyCommand("italic")}>{Icons.italic}</HoverIconButton>
            <HoverIconButton title="Подчеркнуть" onClick={() => applyCommand("underline")}>{Icons.underline}</HoverIconButton>
            <HoverIconButton title="Цвет" onClick={() => applyCommand("foreColor", state.selectedColor)}>{Icons.palette}</HoverIconButton>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <HoverIconButton title="Влево" onClick={() => applyCommand("justifyLeft")}>{Icons.alignLeft}</HoverIconButton>
            <HoverIconButton title="По центру" onClick={() => applyCommand("justifyCenter")}>{Icons.alignCenter}</HoverIconButton>
            <HoverIconButton title="Вправо" onClick={() => applyCommand("justifyRight")}>{Icons.alignRight}</HoverIconButton>
            <HoverIconButton title="Маркированный список" onClick={() => applyCommand("insertUnorderedList")}>{Icons.list}</HoverIconButton>
            <HoverIconButton title="Нумерованный список" onClick={() => applyCommand("insertOrderedList")}>{Icons.ordered}</HoverIconButton>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <GlowButton onClick={saveFormattingSettings}>{Icons.save} Сохранить настройки форматирования</GlowButton>
        </div>
      </PanelSection>

      {/* Section 5: Sender */}
      <PanelSection title="Отправитель" icon={Icons.plane}>
        <LabeledField label="Организация"><PremiumInput value={state.senderOrg} onChange={(e) => patch("senderOrg", e.target.value)} /></LabeledField>
        <LabeledField label="ФИО"><PremiumInput value={state.senderFio} onChange={(e) => patch("senderFio", e.target.value)} /></LabeledField>
      </PanelSection>

      {/* Section 6: Recipient */}
      <PanelSection title="Получатель" icon={Icons.mail}>
        <LabeledField label="Организация"><PremiumInput value={state.recipientOrg} onChange={(e) => patch("recipientOrg", e.target.value)} /></LabeledField>
        <LabeledField label="ФИО"><PremiumInput value={state.recipientFio} onChange={(e) => patch("recipientFio", e.target.value)} /></LabeledField>
      </PanelSection>

      {/* Section 7: Signature & Stamp */}
      <PanelSection title="Подпись и печать" icon={Icons.stamp}>
        <div style={{ display: "grid", gap: 10 }}>
          {(["stamp", "signature"] as const).map((t) => {
            const labels: Record<string, [string, string, string, string, string]> = {
              stamp: ["Добавить печать", "Удалить печать", "stampSrc", "Удалить печать", Icons.stamp as any],
              signature: ["Добавить подпись", "Удалить подпись", "signatureSrc", "Добавить подпись", Icons.pen as any],
            };
            const [addLabel, delLabel, key] = labels[t];
            const ref = t === "stamp" ? stampInputRef : signatureInputRef;
            const serverHas = !!serverBrand[t];
            return (
              <React.Fragment key={t}>
                <GlowButton onClick={() => ref.current?.click()}>
                  {labels[t][4]} {addLabel} {serverHas ? "(на сервере)" : ""}
                </GlowButton>
                <GlowButton
                  danger
                  onClick={async () => {
                    patch(key as any, null);
                    const a = serverBrand[t];
                    if (a) {
                      try {
                        await api.deleteBrand(a.id);
                        setServerBrand((prev) => {
                          const next = { ...prev };
                          delete next[t];
                          return next;
                        });
                      } catch (err) {
                        console.warn("delete brand failed", err);
                      }
                    }
                  }}
                >
                  {Icons.trash} {delLabel}
                </GlowButton>
              </React.Fragment>
            );
          })}
          <GlowButton onClick={() => setGraphicMode((v) => !v)}>{Icons.move} {graphicMode ? "Выключить графический режим" : "Графический режим"}</GlowButton>
        </div>
        <input ref={stampInputRef} type="file" accept=".svg,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={(e) => handleUpload(e.target.files?.[0], "stampSrc")} />
        <input ref={signatureInputRef} type="file" accept=".svg,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={(e) => handleUpload(e.target.files?.[0], "signatureSrc")} />
      </PanelSection>

      {/* Section 8: Drafts & Export */}
      <PanelSection title="Черновики и экспорт" icon={Icons.export}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {(["PDF", "JSON", "PNG"] as ExportFormat[]).map((fmt) => (
              <GlowButton key={fmt} primary={state.exportFormat === fmt} onClick={() => patch("exportFormat", fmt)}>{fmt}</GlowButton>
            ))}
          </div>
          <GlowButton primary onClick={exportCurrent}>{exporting ? "⏳" : Icons.export} {exporting ? "Экспорт..." : "Экспорт"}</GlowButton>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <GlowButton onClick={saveDraft}>{Icons.save} Сохранить черновик</GlowButton>
            <GlowButton onClick={() => setShowDrafts((v) => !v)}>{Icons.drafts} {showDrafts ? "Скрыть черновики" : "Смотреть черновики"}</GlowButton>
          </div>
          {showDrafts && (
            <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
              {state.drafts.length === 0 && (
                <div style={{ padding: 12, color: "#8D8797", fontSize: 13, textAlign: "center" }}>Нет сохранённых черновиков</div>
              )}
              {state.drafts.map((draft) => {
                const serverDraft = draft as ServerDraftMeta;
                return (
                  <div key={draft.id} style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div
                      style={{ flex: 1, minWidth: 0, cursor: serverDraft.serverId ? "pointer" : "default" }}
                      onClick={() => serverDraft.serverId && loadDraftFromServer(serverDraft)}
                      title={serverDraft.serverId ? "Нажмите, чтобы загрузить" : undefined}
                    >
                      <div style={{ color: "rgba(255,255,255,0.94)", fontSize: 13, fontWeight: 700 }}>{draft.name}</div>
                      <div style={{ color: "#8D8797", fontSize: 12, marginTop: 4 }}>
                        {new Date(draft.savedAt).toLocaleString()}
                        {serverDraft.serverId && (
                          <span style={{ marginLeft: 6, color: "#F18F50" }}>· сервер</span>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => deleteDraft(serverDraft)}
                      style={{ background: "none", border: "none", color: "hsl(0 70% 55%)", cursor: "pointer", padding: 4, fontSize: 16, lineHeight: 1, flexShrink: 0 }} title="Удалить черновик">
                      {Icons.trash}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PanelSection>
    </div>
  );

  return (
    <div className="app-bg" style={{ minHeight: "100vh", color: "rgba(255,255,255,0.94)", fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif', position: "relative" }}>
      {/* Atmospheric glow spots */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", left: "15%", top: "10%", width: 600, height: 600, borderRadius: 9999, background: "rgba(241,143,80,0.08)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", right: "10%", bottom: "5%", width: 500, height: 500, borderRadius: 9999, background: "rgba(241,143,80,0.05)", filter: "blur(140px)" }} />
      </div>

      {/* Mobile tab switcher */}
      {isMobile && (
        <div style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", background: "rgba(18,16,39,0.92)", backdropFilter: "blur(18px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button type="button" onClick={() => setMobileTab("settings")} style={{ flex: 1, padding: "14px 0", fontSize: 13, fontWeight: 600, color: mobileTab === "settings" ? "#F18F50" : "#8D8797", background: "none", border: "none", borderBottom: mobileTab === "settings" ? "2px solid #F18F50" : "2px solid transparent", cursor: "pointer" }}>
            ⚙️ Настройки
          </button>
          <button type="button" onClick={() => setMobileTab("preview")} style={{ flex: 1, padding: "14px 0", fontSize: 13, fontWeight: 600, color: mobileTab === "preview" ? "#F18F50" : "#8D8797", background: "none", border: "none", borderBottom: mobileTab === "preview" ? "2px solid #F18F50" : "2px solid transparent", cursor: "pointer" }}>
            📄 Документ
          </button>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1600, margin: "0 auto", padding: isMobile ? 10 : 20, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "380px 1fr", gap: isMobile ? 10 : 20 }}>
        {/* SIDEBAR */}
        {(!isMobile || mobileTab === "settings") && (
          <aside className="glass-card" style={{ position: isMobile ? "relative" : "sticky", top: isMobile ? 0 : 20, alignSelf: "start", borderRadius: isMobile ? 16 : 32, overflow: "hidden", maxHeight: isMobile ? "none" : "calc(100vh - 40px)" }}>
            <div style={{ padding: isMobile ? 14 : 20, borderBottom: "1px solid rgba(255,255,255,0.08)", background: "var(--gradient-hero)", display: "flex", alignItems: "center", gap: 14 }}>
              <img src={appLogo} alt="LetterCraft" style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 14, filter: "drop-shadow(0 0 18px rgba(241,143,80,0.5)) drop-shadow(0 0 40px rgba(241,143,80,0.25))" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? 20 : 22, fontWeight: 600, lineHeight: 1.1, color: "rgba(255,255,255,0.94)", letterSpacing: "-0.02em" }}>LetterCraft</div>
                <div style={{ marginTop: 4, fontSize: 12, color: "hsl(var(--muted-foreground))" }}>{user.email}</div>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                title="Выйти"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.85)",
                  borderRadius: 10,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Выйти
              </button>
            </div>
            {sidebarContent}
          </aside>
        )}

        {/* MAIN PREVIEW */}
        {(!isMobile || mobileTab === "preview") && (
          <main className="glass-card" style={{ borderRadius: isMobile ? 16 : 32, overflow: "hidden" }}>
            <div style={{ padding: isMobile ? 12 : 20, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", background: "var(--gradient-hero)" }}>
              <div>
                <div className="pill-inactive" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", color: "#F18F50", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {Icons.mail} Рабочая область
                </div>
                <div style={{ marginTop: 10, color: "rgba(255,255,255,0.94)", fontSize: isMobile ? 20 : 26, fontWeight: 500, letterSpacing: "-0.02em" }}>Предпросмотр документа A4</div>
                <div style={{ marginTop: 4, color: "#8D8797", fontSize: isMobile ? 12 : 14 }}>Документ отображается так, как должен уйти на печать и на экспорт.</div>
              </div>
              <div className="pill-inactive" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", color: "rgba(255,255,255,0.92)", fontWeight: 500, fontSize: 13 }}>
                {Icons.drafts} {pages.length} стр.
              </div>
            </div>

            <div ref={previewContainerRef} style={{ padding: isMobile ? 10 : 22, display: "grid", justifyContent: "center", gap: 22, overflowX: isMobile ? "auto" : "visible", background: "rgba(18,16,39,0.5)" }}>
              {pages.map((pageHtml, pageIndex) => {
                const isFirst = pageIndex === 0;
                const isLast = pageIndex === pages.length - 1;
                return (
                  <section key={pageIndex} data-page={pageIndex} style={{ position: "relative", width: "210mm", height: "297mm", background: "#ffffff", borderRadius: 4, overflow: "hidden", boxShadow: "0 20px 80px rgba(0,0,0,0.5)", outline: "1px solid rgba(255,255,255,0.06)" }}>
                    <div data-export-hide className="pill-active" style={{ position: "absolute", right: 16, top: 14, zIndex: 3, padding: "4px 10px", color: "#121027", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Page {pageIndex + 1}
                    </div>

                    {isFirst && state.headerSrc ? (
                      <div style={{ position: "relative" }}>
                        <img src={state.headerSrc} alt="Шапка" style={{ display: "block", width: "100%", userSelect: "none" }} />
                        {state.logoSrc && <img src={state.logoSrc} alt="Лого" style={{ position: "absolute", left: 18, top: 14, maxHeight: 48, maxWidth: 140, objectFit: "contain" }} />}
                        <div contentEditable suppressContentEditableWarning onFocus={(e) => (editorSelectionRef.current = e.currentTarget)} onInput={(e) => patch("requisites", e.currentTarget.innerText)}
                          style={{ position: "absolute", right: 24, top: 10, maxWidth: "55%", whiteSpace: "pre-line", color: "#ffffff", fontSize: 11, lineHeight: 1.35, fontWeight: 500, fontFamily: "Involve, sans-serif", outline: "none", textShadow: "0 1px 0 rgba(0,0,0,0.08)", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                          {state.requisites}
                        </div>
                      </div>
                    ) : isFirst ? (
                      <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f0eb", color: "#8D8797", borderBottom: "1px solid #e5e0da" }}>
                        Шапка не загружена
                      </div>
                    ) : null}

                    <div style={{ padding: "14mm 18mm 22mm", position: "relative", fontFamily: state.selectedFont }}>
                      {isFirst && (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
                            <div style={{ display: "grid", gap: 6, alignSelf: "start" }}>
                              {state.showDate && <div style={{ color: "hsl(240 5% 32%)", fontSize: 13 }}><span style={{ fontWeight: 800 }}>Дата:</span> {formatDateRu(state.date)}</div>}
                              {state.showNumber && formattedNumber && <div style={{ color: "hsl(240 5% 32%)", fontSize: 13 }}><span style={{ fontWeight: 800 }}>Номер:</span> {formattedNumber}</div>}
                            </div>
                            <div style={{ marginLeft: "auto", minWidth: 280, maxWidth: 360, display: "grid", gap: 10, textAlign: "right" }}>
                              <div data-export-container style={{ border: "1px solid #e5e0da", borderRadius: 12, background: "rgba(245,240,235,0.5)", padding: 14 }}>
                                <div style={{ color: "#888", fontSize: 12, fontWeight: 400, marginBottom: 4 }}>Отправитель</div>
                                <div contentEditable suppressContentEditableWarning onFocus={(e) => (editorSelectionRef.current = e.currentTarget)} onInput={(e) => patch("senderOrg", e.currentTarget.textContent || "")} style={{ color: "#035094", fontWeight: 700, fontSize: 13, outline: "none" }}>{state.senderOrg || "Наименование организации"}</div>
                                <div contentEditable suppressContentEditableWarning onFocus={(e) => (editorSelectionRef.current = e.currentTarget)} onInput={(e) => patch("senderFio", e.currentTarget.textContent || "")} style={{ color: "#035094", fontWeight: 700, fontSize: 13, outline: "none", marginTop: 4 }}>{state.senderFio || "ФИО"}</div>
                              </div>
                              <div data-export-container style={{ border: "1px solid #e5e0da", borderRadius: 12, background: "rgba(245,240,235,0.5)", padding: 14 }}>
                                <div style={{ color: "#888", fontSize: 12, fontWeight: 400, marginBottom: 4 }}>Получатель</div>
                                <div contentEditable suppressContentEditableWarning onFocus={(e) => (editorSelectionRef.current = e.currentTarget)} onInput={(e) => patch("recipientOrg", e.currentTarget.textContent || "")} style={{ color: "#035094", fontWeight: 700, fontSize: 13, outline: "none" }}>{state.recipientOrg || "Наименование организации"}</div>
                                <div contentEditable suppressContentEditableWarning onFocus={(e) => (editorSelectionRef.current = e.currentTarget)} onInput={(e) => patch("recipientFio", e.currentTarget.textContent || "")} style={{ color: "#035094", fontWeight: 700, fontSize: 13, outline: "none", marginTop: 4 }}>{state.recipientFio || "ФИО"}</div>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                             <div data-export-container style={{ width: "100%", borderRadius: 12, background: "rgba(245,240,235,0.5)", padding: "14px 20px", border: "1px solid #e5e0da" }}>
                              <div contentEditable suppressContentEditableWarning onFocus={(e) => (editorSelectionRef.current = e.currentTarget)} onInput={(e) => patch("title", e.currentTarget.textContent || "")} style={{ textAlign: "center", color: "#035094", fontSize: 20, fontWeight: 800, letterSpacing: "0.02em", outline: "none" }}>{state.title}</div>
                            </div>
                          </div>
                        </>
                      )}

                      <div ref={isFirst ? bodyRef : undefined} contentEditable={isFirst} suppressContentEditableWarning
                        onFocus={isFirst ? (e) => (editorSelectionRef.current = e.currentTarget) : undefined}
                        onInput={isFirst ? (e) => patch("bodyHtml", e.currentTarget.innerHTML) : undefined}
                        dangerouslySetInnerHTML={{ __html: pageHtml }}
                        style={{ minHeight: isFirst ? "60mm" : "180mm", borderRadius: 12, border: "1px solid #e5e0da", background: "#ffffff", padding: 18, fontSize: state.selectedFontSize, lineHeight: 1.6, color: state.selectedColor, fontFamily: state.selectedFont, outline: "none", overflow: "hidden" }} />

                      {isLast && (
                        <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20 }}>
                          <div style={{ minWidth: 320 }}>
                            <div contentEditable suppressContentEditableWarning onFocus={(e) => (editorSelectionRef.current = e.currentTarget)} onInput={(e) => patch("signerRole", e.currentTarget.textContent || "")} style={{ color: "hsl(240 5% 32%)", fontSize: 13, outline: "none" }}>{state.signerRole}</div>
                            <div style={{ marginTop: 3, display: "flex", alignItems: "center", gap: 6, color: "hsl(240 5% 32%)", fontSize: 13, fontWeight: 800 }}>
                              <span contentEditable suppressContentEditableWarning onFocus={(e) => (editorSelectionRef.current = e.currentTarget)} onInput={(e) => patch("signerName", e.currentTarget.textContent || "")} style={{ outline: "none" }}>{state.signerName}</span>
                              <span style={{ flex: 1, borderBottom: "1.8px solid hsl(240 5% 46%)", minWidth: 180, transform: "translateY(2px)" }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {isLast && !exporting && (
                      <>
                        {state.signatureSrc ? (
                          <img src={state.signatureSrc} alt="Подпись" onMouseDown={(e) => startDrag("signature", e)} onClick={() => setSelectedObject("signature")}
                            style={{ position: "absolute", left: signatureRect.x, top: signatureRect.y, width: signatureRect.w, height: signatureRect.h, objectFit: "contain", cursor: graphicMode ? "grab" : "default", userSelect: "none", zIndex: 6 }} />
                        ) : (
                          <div data-export-hide onMouseDown={(e) => startDrag("signature", e)} style={{ position: "absolute", left: signatureRect.x, top: signatureRect.y, width: signatureRect.w, height: signatureRect.h, border: "1.5px dashed #ccc", borderRadius: 8, color: "#888", display: "grid", placeItems: "center", fontSize: 12, background: "rgba(245,240,235,0.5)", cursor: graphicMode ? "grab" : "default", zIndex: 6 }}>Подпись</div>
                        )}
                        {state.stampSrc ? (
                          <img src={state.stampSrc} alt="Печать" onMouseDown={(e) => startDrag("stamp", e)} onClick={() => setSelectedObject("stamp")}
                            style={{ position: "absolute", left: stampRect.x, top: stampRect.y, width: stampRect.w, height: stampRect.h, objectFit: "contain", opacity: 0.96, cursor: graphicMode ? "grab" : "default", userSelect: "none", zIndex: 7 }} />
                        ) : (
                          <div data-export-hide onMouseDown={(e) => startDrag("stamp", e)} style={{ position: "absolute", left: stampRect.x, top: stampRect.y, width: stampRect.w, height: stampRect.h, border: "1.5px dashed #ccc", borderRadius: 8, color: "#888", display: "grid", placeItems: "center", fontSize: 12, background: "rgba(245,240,235,0.5)", cursor: graphicMode ? "grab" : "default", zIndex: 7 }}>Печать</div>
                        )}
                      </>
                    )}

                    {isLast && exporting && (
                      <>
                        {state.signatureSrc && (
                          <img src={state.signatureSrc} alt="Подпись"
                            style={{ position: "absolute", left: signatureRect.x, top: signatureRect.y, width: signatureRect.w, height: signatureRect.h, objectFit: "contain", zIndex: 6 }} />
                        )}
                        {state.stampSrc && (
                          <img src={state.stampSrc} alt="Печать"
                            style={{ position: "absolute", left: stampRect.x, top: stampRect.y, width: stampRect.w, height: stampRect.h, objectFit: "contain", opacity: 0.96, zIndex: 7 }} />
                        )}
                      </>
                    )}

                    {state.footerSrc ? (
                      <img src={state.footerSrc} alt="Футтер" style={{ position: "absolute", left: 0, bottom: 0, width: "100%", display: "block", userSelect: "none" }} />
                    ) : (
                      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 48, background: "#f5f0eb", borderTop: "1px solid #e5e0da", display: "grid", placeItems: "center", color: "#888", fontSize: 12 }}>Футтер не загружен</div>
                    )}
                  </section>
                );
              })}
            </div>

            {graphicMode && (
              <div style={{ padding: "0 22px 22px", display: "flex", flexWrap: "wrap", gap: 10 }}>
                <GlowButton onClick={() => selectedObject === "signature" && setSignatureRect((r) => { const nextW = r.w + 12; return { ...r, w: nextW, h: Math.round((r.h / r.w) * nextW) }; })}>{Icons.move} Подпись шире</GlowButton>
                <GlowButton onClick={() => selectedObject === "signature" && setSignatureRect((r) => { const nextW = Math.max(80, r.w - 12); return { ...r, w: nextW, h: Math.max(32, Math.round((r.h / r.w) * nextW)) }; })}>{Icons.move} Подпись уже</GlowButton>
                <GlowButton onClick={() => selectedObject === "stamp" && setStampRect((r) => ({ ...r, w: r.w + 8, h: r.h + 8 }))}>{Icons.move} Печать больше</GlowButton>
                <GlowButton onClick={() => selectedObject === "stamp" && setStampRect((r) => ({ ...r, w: Math.max(52, r.w - 8), h: Math.max(52, r.h - 8) }))}>{Icons.move} Печать меньше</GlowButton>
              </div>
            )}

            <div ref={pageMeasureRef} style={{ position: "absolute", left: -99999, top: -99999, visibility: "hidden", pointerEvents: "none" }} />
          </main>
        )}
      </div>

      {draftSavedToast && (
        <div className="pill-active" style={{ position: "fixed", right: 24, bottom: 24, padding: "12px 16px", color: "#121027", fontWeight: 600, fontSize: 13, zIndex: 200 }}>
          {draftSavedToast}
        </div>
      )}
    </div>
  );
}
