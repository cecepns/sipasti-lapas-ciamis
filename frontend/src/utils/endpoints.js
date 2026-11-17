export const API_ENDPOINTS = {
  HEALTH: '/health',

  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
  },

  PUBLIC: {
    SUMMARY: '/public/summary',
    WBP_SEARCH: '/public/wbp-search',
    PROGRAMS: '/public/programs',
    ABSENSI: '/public/absensi',
    MITRA_REGISTER: '/public/mitra-register',
  },

  USERS: {
    LIST: '/users',
    DETAIL: (id) => `/users/${id}`,
  },

  MITRA: {
    LIST: '/mitra',
    DETAIL: (id) => `/mitra/${id}`,
  },

  WBP: {
    LIST: '/wbp',
    DETAIL: (id) => `/wbp/${id}`,
    ENROLL_FACE: (id) => `/wbp/${id}/enroll-face`,
  },

  PROGRAMS: {
    LIST: '/programs',
    DETAIL: (id) => `/programs/${id}`,
  },

  ASSESSMENTS: {
    LIST: '/assessments',
    DETAIL: (id) => `/assessments/${id}`,
    VERIFY: (id) => `/assessments/${id}/verify`,
  },

  ATTENDANCES: {
    LIST: '/attendances',
    DETAIL: (id) => `/attendances/${id}`,
  },

  DASHBOARD: {
    UMUM: '/dashboard/umum',
    WBP: '/dashboard/wbp',
    PROGRAM: '/dashboard/program',
    ASESOR: '/dashboard/asesor',
  },

  REPORTS: {
    EXPORT_DATA: '/reports/export-data',
  },
};
