import API from './axios';

// ═══ Authentification ═══════════════════════════════════════════════════════

export const registerUniversity = (data) =>
  API.post('/universities/register', data);

export const login = (email, password) =>
  API.post('/auth/login', { email, password });

export const getMe = () =>
  API.get('/auth/me');

export const refreshToken = (refresh_token) =>
  API.post('/auth/refresh', { refresh_token });

export const forgotPassword = (email) =>
  API.post('/auth/forgot-password', { email });

export const verifyCode = (email, code) =>
  API.post('/auth/verify-code', { email, code });

export const confirmResetPassword = (email, code, new_password) =>
  API.post('/auth/confirm-reset-password', { email, code, new_password });

export const resetPassword = (token, new_password) =>
  API.post('/auth/reset-password', { token, new_password });

// ═══ Université ═════════════════════════════════════════════════════════════

export const getMyUniversity = () =>
  API.get('/universities/me');

export const updateMyUniversity = (data) =>
  API.put('/universities/me', data);

// ═══ Utilisateurs ═══════════════════════════════════════════════════════════

export const createUser = (data) =>
  API.post('/users/', data);

export const getUsers = (role = null) => {
  const params = role ? { role } : {};
  return API.get('/users/', { params });
};

export const getUserById = (id) =>
  API.get(`/users/${id}`);

export const updateUser = (id, data) =>
  API.put(`/users/${id}`, data);

export const deleteUser = (id) =>
  API.delete(`/users/${id}`);

export const createUsersBulk = (data) =>
  API.post('/users/bulk', data);

// ═══ Académique ═════════════════════════════════════════════════════════════

export const getStudyYears = () =>
  API.get('/academic/years');

export const createStudyYear = (data) =>
  API.post('/academic/years', data);

export const autoGroupStudents = (study_year_id) =>
  API.post(`/academic/years/${study_year_id}/auto-group`);

export const assignTeacherToYear = (study_year_id, teacher_id) =>
  API.post(`/academic/years/${study_year_id}/teachers/${teacher_id}`);

export const createSchedule = (data) =>
  API.post(`/academic/schedules`, data);

export const getGroupSchedules = (group_id) =>
  API.get(`/academic/schedules/group/${group_id}`);

