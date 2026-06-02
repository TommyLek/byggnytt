import type {
  Newsletter,
  CreateNewsletterRequest,
  UpdateNewsletterRequest,
  ImageInfo,
  Template,
  ProductContent,
} from '@byggnytt/shared';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Okänt fel' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Newsletters
export const api = {
  newsletters: {
    list: (params?: { channel?: string; status?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request<Newsletter[]>(`/newsletters${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<Newsletter>(`/newsletters/${id}`),
    create: (data: CreateNewsletterRequest) =>
      request<Newsletter>('/newsletters', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateNewsletterRequest) =>
      request<Newsletter>(`/newsletters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/newsletters/${id}`, { method: 'DELETE' }),
    duplicate: (id: string) =>
      request<Newsletter>(`/newsletters/${id}/duplicate`, { method: 'POST' }),
  },

  render: {
    preview: (blocks: Newsletter['blocks'], settings: Newsletter['settings'], channel?: string) =>
      request<{ html: string }>('/render', {
        method: 'POST',
        body: JSON.stringify({ blocks, settings, channel }),
      }),
    mjml: (blocks: Newsletter['blocks'], settings: Newsletter['settings'], channel?: string) =>
      request<{ html: string }>('/render/mjml', {
        method: 'POST',
        body: JSON.stringify({ blocks, settings, channel }),
      }),
  },

  export: {
    pdf: async (id: string): Promise<Blob> => {
      const res = await fetch(`${API_BASE}/export/pdf/${id}`, { method: 'POST' });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'PDF-generering misslyckades' }));
        throw new Error(error.error || `HTTP ${res.status}`);
      }
      return res.blob();
    },
    publicUrl: (id: string) => `${API_BASE}/export/public/${id}`,
  },

  images: {
    list: () => request<ImageInfo[]>('/images'),
    upload: async (file: File): Promise<ImageInfo> => {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Uppladdning misslyckades' }));
        throw new Error(error.error);
      }
      return res.json();
    },
    delete: (id: string) =>
      request<void>(`/images/${id}`, { method: 'DELETE' }),
  },

  templates: {
    list: (channel?: string) => {
      const query = channel ? `?channel=${channel}` : '';
      return request<Template[]>(`/templates${query}`);
    },
    get: (id: string) => request<Template>(`/templates/${id}`),
    create: (data: { name: string; channel: string; from_newsletter_id?: string }) =>
      request<Template>('/templates', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/templates/${id}`, { method: 'DELETE' }),
  },

  productLookup: {
    bySku: (sku: string, channel?: string) => {
      const query = channel ? `?channel=${channel}` : '';
      return request<ProductContent>(`/product-lookup/${encodeURIComponent(sku)}${query}`);
    },
  },
};
