// ─── Load all admin info ──────────────────────────────────────────────────────
window.loadAdminInfo = async function() {
  var loader = window.showLoading('Loading account info...');
  try {
    var res = await window.api.adminGet('/admin/account/get-admin-info');
    if (!res?.data?.success) return;

    var admins = res.data.data || [];

    // Populate settings form with first admin
    var info = admins[0];
    if (info) {
      var fieldMap = {
        'sidebar-user-name':     info.name,
        'sidebar-business-name': info.business_name,
        'setting-name':          info.name,
        'setting-business-name': info.business_name,
        'setting-username':      info.username,
      };
      Object.keys(fieldMap).forEach(function(id) {
        var el = document.getElementById(id);
        if (!el) return;
        if (el.tagName === 'INPUT') el.value = fieldMap[id] || '';
        else el.textContent = fieldMap[id] || '';
      });
    }

    // List all admins in the admin list container if it exists
    var listContainer = document.getElementById('admin-list');
    if (listContainer && admins.length) {
      listContainer.innerHTML = admins.map(function(a) {
        return '<div class="flex items-center justify-between bg-[#0f1117] border border-white/5 rounded-lg px-4 py-3 mb-2">' +
          '<div class="flex items-center gap-3">' +
          '<div class="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center text-mist text-xs font-semibold">' + (a.name ? a.name.charAt(0) : 'A') + '</div>' +
          '<div><p class="text-slate-200 text-sm">' + (a.name || '—') + '</p>' +
          '<p class="text-slate-500 text-xs">' + (a.username || '—') + ' · ' + (a.business_name || '—') + '</p></div>' +
          '</div></div>';
      }).join('');
    }

  } catch(e) {
    window.showToast('An error occurred. Please try again.', 'error');
  } finally {
    window.dismissToast(loader);
  }
};

// ─── Update admin info ────────────────────────────────────────────────────────
window.updateAdminInfo = async function(e) {
  e.preventDefault();
  var loader = window.showLoading('Saving changes...');

  try {
    var newUsername     = document.getElementById('setting-username')         ? document.getElementById('setting-username').value.trim()         : '';
    var newPassword     = document.getElementById('setting-new-password')     ? document.getElementById('setting-new-password').value            : '';
    var newName         = document.getElementById('setting-name')             ? document.getElementById('setting-name').value.trim()             : '';
    var newBusinessName = document.getElementById('setting-business-name')    ? document.getElementById('setting-business-name').value.trim()    : '';
    var confirmOldPw    = document.getElementById('setting-confirm-password') ? document.getElementById('setting-confirm-password').value        : '';

    if (!confirmOldPw) {
      window.showToast('Please enter your current password to confirm changes.', 'warning');
      return;
    }

    var payload = { confirm_old_password: confirmOldPw };
    if (newUsername)     payload.new_username      = newUsername;
    if (newPassword)     payload.new_password      = newPassword;
    if (newName)         payload.new_name          = newName;
    if (newBusinessName) payload.new_business_name = newBusinessName;

    var res = await window.api.adminPost('/admin/account/change-admin-info', payload, { skipAuthRedirect: true });

    if (!res) return;

    if (res.data?.success) {
      window.showToast('Account updated successfully.', 'success');
      var pwField      = document.getElementById('setting-new-password');
      var confirmField = document.getElementById('setting-confirm-password');
      if (pwField)      pwField.value      = '';
      if (confirmField) confirmField.value = '';
      // Update sidebar with sent data
      if (newName) {
        var nameEl = document.getElementById('sidebar-user-name');
        if (nameEl) nameEl.textContent = newName;
      }
      if (newBusinessName) {
        var bizEl = document.getElementById('sidebar-business-name');
        if (bizEl) bizEl.textContent = newBusinessName;
      }
    } else if (res.status === 409) {
      window.showToast('That username is already in use.', 'error');
    } else if (res.status === 401) {
      window.showToast('Current password is incorrect.', 'error');
    } else {
      window.showToast(res.data?.message || 'Failed to update account.', 'error');
    }

  } catch(e) {
    window.showToast('An error occurred. Please try again.', 'error');
  } finally {
    window.dismissToast(loader);
  }
};