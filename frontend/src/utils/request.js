import { api } from './api';

export function extractErrorMessage(error, fallback = 'Terjadi kesalahan pada server') {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return fallback;
}

export const request = {
  async get(url, params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    const { data } = await api.get(url, { params: cleanParams });
    return data;
  },

  async post(url, payload = {}, config = {}) {
    const { data } = await api.post(url, payload, config);
    return data;
  },

  async put(url, payload = {}, config = {}) {
    const { data } = await api.put(url, payload, config);
    return data;
  },

  async patch(url, payload = {}, config = {}) {
    const { data } = await api.patch(url, payload, config);
    return data;
  },

  async del(url, config = {}) {
    const { data } = await api.delete(url, config);
    return data;
  },

  async upload(url, formData, method = 'post') {
    const { data } = await api[method](url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
