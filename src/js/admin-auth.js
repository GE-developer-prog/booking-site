// ─── Admin Login ──────────────────────────────────────────────────────────────
window.adminLogin = async function(username, password) {
  var loader = window.showLoading('Signing in...');
  try {
    var res = await window.api.post('/admin/login', {
      username: username,
      password: password
    }, { skipAuthRedirect: true });

    if (res && res.ok && res.data?.success) {
      window.setAdminToken(res.data.data.token);
      return true;
    }

    if (res && res.status === 401) {
      window.showToast('Invalid username or password.', 'error');
    } else {
      window.showToast((res && res.data?.message) || 'Login failed. Please try again.', 'error');
    }
    return false;

  } catch(e) {
    window.showToast('An error occurred. Please try again.', 'error');
    return false;
  } finally {
    window.dismissToast(loader);
  }
};

// ─── Admin Logout ─────────────────────────────────────────────────────────────
window.adminLogout = function() {
  window.clearAdminToken();
  window.navigateTo('/dashboard-login.html');
};

// ─── Guard dashboard page ─────────────────────────────────────────────────────
window.requireAdminAuth = function() {
  if (!window.getAdminToken()) {
    window.navigateTo('/dashboard-login.html');
    return false;
  }
  return true;
};