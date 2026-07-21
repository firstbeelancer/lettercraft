export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function formatDateRu(date: string) {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) return date;
  return `${d}.${m}.${y}`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function splitHtmlIntoBlocks(html: string): string[] {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const nodes = Array.from(tmp.childNodes).filter(
    (n) => !(n.nodeType === Node.TEXT_NODE && !(n.textContent || "").trim())
  );
  if (!nodes.length) return ["<p><br></p>"];
  return nodes.map((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const p = document.createElement("p");
      p.textContent = node.textContent || "";
      return p.outerHTML;
    }
    return (node as HTMLElement).outerHTML;
  });
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
