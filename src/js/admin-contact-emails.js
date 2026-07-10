window.loadContactEmails = async function() {
  var container = document.getElementById('contact-emails-list');
  if (!container) return;
  container.innerHTML = '<div class="text-center py-6 text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading...</div>';

  try {
    var res = await window.api.adminGet('/admin/contact-email/list');
    if (!res?.data?.success) { // 401 already handled globally by api.js (handle401)
      container.innerHTML = '<div class="text-center py-6 text-slate-500">Failed to load contact emails.</div>';
      return;
    }
    var emails = res.data.data || [];
    if (!emails.length) {
      container.innerHTML = '<div class="text-center py-6 text-slate-500">No notification emails added yet.</div>';
      return;
    }
    container.innerHTML = emails.map(function(e) {
      return '<div class="flex items-center justify-between bg-[#161b27] border border-white/5 rounded-lg px-4 py-3 mb-2" data-email-id="' + e.id + '"><div class="flex items-center gap-3"><i class="fa-solid fa-envelope text-sage text-sm"></i><span class="text-slate-200 text-sm">' + e.email + '</span></div><button onclick="deleteContactEmail(' + e.id + ')" class="dash-btn-danger text-xs"><i class="fa-solid fa-trash"></i></button></div>';
    }).join('');
  } catch(e) {
    container.innerHTML = '<div class="text-center py-6 text-slate-500">An error occurred. Please try again.</div>';
  }
};

window.addContactEmail = async function(e) {
  e.preventDefault();
  var input = document.getElementById('new-contact-email');
  var email = input ? input.value.trim() : '';
  if (!email) { window.showToast('Please enter an email address.', 'warning'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { window.showToast('Please enter a valid email.', 'warning'); return; }

  var loader = window.showLoading('Adding email...');
  try {
    var res = await window.api.adminPost('/admin/contact-email/add', { email: email });
    if (!res) return; // 401 already handled globally by api.js (handle401)

    // TEMPORARY: same empty-response pattern seen elsewhere (booking,
    // approve, reject, services) — if the HTTP status was successful but
    // the body couldn't be parsed, treat it as success too. Remove once
    // backend always returns proper JSON.
    var isEmptyBodySuccess = res.ok && res.data?.message === 'Invalid server response';

    if (((res.status === 200 || res.status === 201) && res.data?.success) || isEmptyBodySuccess) {
      window.showToast('Contact email added.', 'success');
      if (input) input.value = '';
      void window.loadContactEmails();
    } else if (res.status === 409) {
      window.showToast('That email is already in the list.', 'warning');
    } else {
      window.showToast(res.data?.message || 'Failed to add email.', 'error');
    }
  } catch(e) {
    window.showToast('An error occurred. Please try again.', 'error');
  } finally {
    window.dismissToast(loader);
  }
};

window.deleteContactEmail = async function(id) {
  var confirmed = await window.showConfirm({ title: 'Remove Contact Email', message: 'This email will stop receiving booking notifications.', confirmText: 'Remove', danger: true });
  if (!confirmed) return;

  var loader = window.showLoading('Removing email...');
  try {
    var res = await window.api.adminDelete('/admin/contact-email/delete/' + id);
    if (!res) return; // 401 already handled globally by api.js (handle401)

    // TEMPORARY: same empty-response pattern seen elsewhere. Remove once
    // backend always returns proper JSON.
    var isEmptyBodySuccess = res.ok && res.data?.message === 'Invalid server response';

    if (res.data?.success || isEmptyBodySuccess) {
      window.showToast('Email removed.', 'success');
      var card = document.querySelector('[data-email-id="' + id + '"]');
      if (card) card.remove();
    } else {
      window.showToast(res.data?.message || 'Failed to remove email.', 'error');
    }
  } catch(e) {
    window.showToast('An error occurred. Please try again.', 'error');
  } finally {
    window.dismissToast(loader);
  }
};