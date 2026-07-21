// LetterCraft API client — заменяет Supabase

const API_BASE = "/api/v1";

export type ApiUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export type AuthVerifyResponse = {
  token: string;
  user: ApiUser;
};

export type Letter = {
  id: string;
  name: string;
  title: string | null;
  isDraft: boolean;
  state: any;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
};

export type LetterSummary = Omit<Letter, "state">;

export type BrandAsset = {
  id: string;
  type: "header" | "footer" | "logo" | "stamp" | "signature";
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  dataUrl: string | null;
  url: string;
};

const TOKEN_KEY = "lettercraft.token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = `http_${res.status}`;
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {
      /* ignore */
    }
    const err = new Error(msg);
    (err as any).status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  // ---------- auth ----------
  async requestMagicLink(email: string) {
    return request<{ ok: true }>("/auth/magic-link", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  async verifyToken(token: string) {
    return request<AuthVerifyResponse>(
      `/auth/verify?token=${encodeURIComponent(token)}`
    );
  },
  async me() {
    return request<{ user: ApiUser }>("/auth/me");
  },
  async logout() {
    return request<{ ok: true }>("/auth/logout", { method: "POST" });
  },

  // ---------- letters ----------
  async listLetters() {
    return request<{ letters: LetterSummary[] }>("/letters");
  },
  async getLetter(id: string) {
    return request<{ letter: Letter }>(`/letters/${id}`);
  },
  async createLetter(body: {
    name: string;
    title?: string | null;
    isDraft?: boolean;
    state: any;
  }) {
    return request<{ letter: Letter }>("/letters", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  async updateLetter(
    id: string,
    body: Partial<{
      name: string;
      title: string | null;
      isDraft: boolean;
      state: any;
    }>
  ) {
    return request<{ letter: Letter }>(`/letters/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  async deleteLetter(id: string) {
    return request<{ ok: true }>(`/letters/${id}`, { method: "DELETE" });
  },

  // ---------- brand ----------
  async listBrand() {
    return request<{ assets: BrandAsset[] }>("/brand");
  },
  async uploadBrand(type: string, file: File) {
    const fd = new FormData();
    fd.append("type", type);
    fd.append("file", file);
    return request<{ asset: BrandAsset }>("/brand", {
      method: "POST",
      body: fd,
    });
  },
  async deleteBrand(id: string) {
    return request<{ ok: true }>(`/brand/${id}`, { method: "DELETE" });
  },
  brandUrl(id: string) {
    return `${API_BASE}/brand/${id}/file`;
  },
};

// Удобный хелпер: выбрать dataUrl (если есть) или url
export function assetSrc(a: BrandAsset): string {
  return a.dataUrl || a.url;
}
