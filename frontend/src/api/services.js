import API from './axios';

// â•â•â• Authentification â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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

// Profile
export const updateMyProfile = (data) =>
  API.put('/auth/me', data);

export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/auth/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// â•â•â• UniversitÃ© â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const getMyUniversity = () =>
  API.get('/universities/me');

export const updateMyUniversity = (data) =>
  API.put('/universities/me', data);

// â•â•â• Utilisateurs â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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

export const importStudentsExcel = (file, levelId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('level_id', levelId);
  return API.post('/users/bulk/excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const toggleUserActive = (id) =>
  API.put(`/users/${id}/toggle-active`);

export const resetUserPassword = (id, new_password) =>
  API.put(`/users/${id}/reset-password`, { new_password });

// â•â•â• AcadÃ©mique â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// Tree
export const getAcademicTree = () => API.get('/academic/tree');

// Faculties
export const getFaculties = () => API.get('/academic/faculties');
export const createFaculty = (data) => API.post('/academic/faculties', data);

// Departments
export const getDepartments = (faculty_id) => API.get(`/academic/faculties/${faculty_id}/departments`);
export const createDepartment = (data) => API.post('/academic/departments', data);

// Specialties
export const getSpecialties = (department_id) => API.get(`/academic/departments/${department_id}/specialties`);
export const createSpecialty = (data) => API.post('/academic/specialties', data);

// Levels
export const getLevels = (specialty_id) => API.get(`/academic/specialties/${specialty_id}/levels`);
export const createLevel = (data) => API.post('/academic/levels', data);

// Semesters
export const getSemesters = (level_id) => API.get(`/academic/levels/${level_id}/semesters`);
export const createSemester = (data) => API.post('/academic/semesters', data);

// Modules
export const getModules = (semester_id) => API.get(`/academic/semesters/${semester_id}/modules`);
export const createModule = (data) => API.post('/academic/modules', data);

// Assignments
export const assignTeacherToModule = (teacher_id, module_id) => 
  API.post('/academic/teacher-modules', { teacher_id, module_id });

export const enrollStudentToLevel = (student_id, level_id) => 
  API.post('/academic/student-enrollments', { student_id, level_id });

export const getModuleTeachers = (module_id) => API.get(`/academic/modules/${module_id}/teachers`);
export const getLevelStudents = (level_id) => API.get(`/academic/levels/${level_id}/students`);

// â•â•â• Dashboard â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const getAdminStats = () => API.get('/universities/stats');

export const importModulesExcel = (semesterId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('semester_id', semesterId);
  return API.post('/academic/modules/bulk/excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteModule = (id) => API.delete(`/academic/modules/${id}`);
export const deleteAllModules = (semesterId) => API.delete(`/academic/semesters/${semesterId}/modules`);
