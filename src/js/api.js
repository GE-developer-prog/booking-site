// ─── Base URL ─────────────────────────────────────────────────────────────────
var BASE_URL = "https://printers-power-migration-impact.trycloudflare.com/api/v1";

// ─── Admin token — stored in cookie, 1 hour expiry ───────────────────────────
window.setAdminToken = function(t) {
  var expires = new Date(Date.now() + 60 * 60 * 1000).toUTCString();
  document.cookie = 'bes_admin_token=' + t + '; expires=' + expires + '; path=/; SameSite=Strict';
};

window.getAdminToken = function() {
  var match = document.cookie.match(/(?:^|;\s*)bes_admin_token=([^;]+)/);
  return match ? match[1] : null;
};

window.clearAdminToken = function() {
  document.cookie = 'bes_admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

// ─── Last session date — clients only ────────────────────────────────────────
var CLIENT_SESSION_KEY = 'bes_client_last_session';
window.getClientLastSession  = function() { return localStorage.getItem(CLIENT_SESSION_KEY) || null; };
window.saveClientLastSession = function(date) { if (date) localStorage.setItem(CLIENT_SESSION_KEY, date); };

// ─── Strip leading + from phone ───────────────────────────────────────────────
window.sanitizePhone = function(phone) {
  return phone ? phone.toString().trim().replace(/^\+/, '') : '';
};

// ─── phpspa-aware navigation ──────────────────────────────────────────────────
window.navigateTo = function(path) {
  if (typeof phpspa !== 'undefined') {
    phpspa.navigate(path);
  } else {
    window.location.href = path;
  }
};

// ─── JSON headers ─────────────────────────────────────────────────────────────
function jsonHeaders(auth) {
  var h = { 'Content-Type': 'application/json' };
  if (auth && window.getAdminToken()) h['Authorization'] = 'Bearer ' + window.getAdminToken();
  return h;
}

// ─── FormData headers ─────────────────────────────────────────────────────────
function formDataHeaders() {
  var h = {};
  if (window.getAdminToken()) h['Authorization'] = 'Bearer ' + window.getAdminToken();
  return h;
}

// ─── Handle 401 ───────────────────────────────────────────────────────────────
// Only for admin-authenticated routes (expired/invalid session token).
// The login endpoint also returns 401 (for bad credentials) but handles that
// itself via skipAuthRedirect — see apiRequest below.
function handle401() {
  window.clearAdminToken();
  var goLogin = confirm('Unauthorized. Login?');
  if (goLogin) {
    window.navigateTo('/dashboard-login.html');
  }
}

// ─── Core request wrapper ─────────────────────────────────────────────────────
async function apiRequest(method, path, options) {
  options = options || {};
  var url = BASE_URL + path;
  var fetchOptions = { method: method };

  if (options.formData) {
    fetchOptions.headers = formDataHeaders();
    fetchOptions.body    = options.formData;
  } else {
    fetchOptions.headers = jsonHeaders(options.auth);
    if (options.body) fetchOptions.body = JSON.stringify(options.body);
  }

  var res = await fetch(url, fetchOptions);

  // Skip the global session-expiry handler for calls that manage their own
  // 401 response (e.g. login, where 401 means "bad credentials", not
  // "your session token expired").
  if (res.status === 401 && !options.skipAuthRedirect) {
    handle401();
    return null;
  }

  // Global rate-limit handler — applies to every request, regardless of
  // which endpoint or auth type. 429 means the client has sent too many
  // requests in the current window (see RateLimitMiddleware on the backend).
  if (res.status === 429) {
    window.showToast('Too many requests, wait a moment.', 'warning');
    return { ok: false, status: 429, data: { success: false, message: 'Too many requests, wait a moment.' } };
  }

  var data = await res.json().catch(function() {
    return { success: false, message: 'Invalid server response' };
  });
  return { ok: res.ok, status: res.status, data: data };
}

// ─── Public API object ────────────────────────────────────────────────────────
window.api = {
  get:         function(path, opts)        { return apiRequest('GET',    path, opts); },
  post:        function(path, body, opts)  { return apiRequest('POST',   path, Object.assign({ body: body }, opts)); },
  patch:       function(path, body, opts)  { return apiRequest('PATCH',  path, Object.assign({ body: body }, opts)); },
  delete:      function(path, opts)        { return apiRequest('DELETE', path, opts); },
  adminGet:    function(path, opts)              { return apiRequest('GET',    path, Object.assign({ auth: true }, opts)); },
  adminPost:   function(path, body, opts)        { return apiRequest('POST',   path, Object.assign({ body: body,   auth: true }, opts)); },
  adminPatch:  function(path, body, opts)        { return apiRequest('PATCH',  path, Object.assign({ body: body,   auth: true }, opts)); },
  adminDelete: function(path, opts)              { return apiRequest('DELETE', path, Object.assign({ auth: true }, opts)); },
  adminForm:   function(path, fd, method, opts)  { return apiRequest(method || 'POST', path, Object.assign({ formData: fd, auth: true }, opts)); },
};