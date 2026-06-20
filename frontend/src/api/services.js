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
