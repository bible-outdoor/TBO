// Authentication and Token Management Module

// Store token and user info
export function setAdminSession(token, user) {
  localStorage.setItem('adminToken', token);
  localStorage.setItem('adminUser', JSON.stringify(user));
}

// Retrieve token
export function getAdminToken() {
  return localStorage.getItem('adminToken');
}

// Retrieve user info
export function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem('adminUser'));
  } catch { return null; }
}

// Clear session
export function clearAdminSession() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
}

// Check if token is expired (assumes JWT)
export function isTokenExpired() {
  const token = getAdminToken();
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// Require authentication for protected pages
export function requireAdminAuth(redirectTo = "login.html") {
  if (!getAdminToken() || isTokenExpired()) {
    clearAdminSession();
    window.location = redirectTo;
  }
}
