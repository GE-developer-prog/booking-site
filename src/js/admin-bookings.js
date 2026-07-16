// ─── Load booking overview stats ──────────────────────────────────────────────
window.loadBookingOverview = async function() {
  try {
    var res = await window.api.adminGet('/admin/booking/overview');
    if (!res?.data?.success) return; // 401 already handled globally by api.js (handle401)

    var d = res.data.data;
    var fields = {
      'stat-today':   d.todays_bookings,
      'stat-week':    d.this_weeks_sessions,
      'stat-revenue': '$' + parseFloat(d.monthly_revenue || 0).toFixed(2),
      'stat-pending': d.pending_bookings,
    };
    Object.keys(fields).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.textContent = fields[id];
    });

    var badge = document.getElementById('pending-badge');
    if (badge) {
      badge.textContent = d.pending_bookings || 0;
      badge.style.display = d.pending_bookings > 0 ? 'inline' : 'none';
    }
  } catch(e) {
    window.showToast('An error occurred. Please try again.', 'error');
  }
};

// ─── Load bookings list ───────────────────────────────────────────────────────
window.loadBookings = async function() {
  var tbody = document.getElementById('bookings-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading bookings...</td></tr>';

  try {
    var res = await window.api.adminGet('/admin/booking/list');
    if (!res?.data?.success) { // 401 already handled globally by api.js (handle401)
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-slate-500">Failed to load bookings.</td></tr>';
      return;
    }

    var bookings = res.data.data || [];
    window._adminBookings = bookings;

    if (!bookings.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-slate-500">No bookings yet.</td></tr>';
      return;
    }

    tbody.innerHTML = bookings.map(function(b) {
      var approveRejectBtns = b.status === 'pending'
        ? '<button onclick="approveBooking(' + b.id + ')" class="text-xs px-2 py-1 bg-sage/20 text-mist rounded hover:bg-sage/30 transition-colors font-body border-none cursor-pointer">Approve</button>' +
          '<button onclick="openRejectModal(' + b.id + ')" class="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors font-body border-none cursor-pointer">Reject</button>'
        : '';
      var paymentStatus = b.payment_status || 'pending';
      var paymentBadgeCls = paymentStatus === 'paid' ? 'bg-green-500/10 text-green-400'
        : paymentStatus === 'failed' ? 'bg-red-500/10 text-red-400'
        : 'bg-yellow-500/10 text-yellow-400';
      return '<tr data-booking-id="' + b.id + '">' +
        '<td><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-sage/20 flex items-center justify-center text-mist text-xs font-semibold shrink-0">' + (b.name ? b.name.charAt(0) : '?') + '</div>' +
        '<div><p class="text-slate-200 text-sm">' + (b.name || '') + '</p><p class="text-slate-500 text-xs">' + (b.email || '') + '</p></div></div></td>' +
        '<td class="text-slate-400 text-sm">' + (b.phone || '—') + '</td>' +
        '<td><p class="text-slate-300 text-sm">' + (b.service ? b.service.title : '—') + '</p><p class="text-slate-500 text-xs capitalize">' + (b.service ? b.service.type : '') + '</p></td>' +
        '<td><p class="text-slate-300 text-sm">' + (b.date || '—') + '</p><p class="text-slate-500 text-xs">' + (b.time || '') + (b.timezone ? ' (' + b.timezone + ')' : '') + '</p></td>' +
        '<td class="text-green-400 text-sm">' + (b.service && b.service.price ? '$' + parseFloat(b.service.price).toFixed(2) : '—') + '</td>' +
        '<td><span class="badge badge-' + b.status + '">' + b.status + '</span></td>' +
        '<td><span class="text-xs px-2 py-0.5 rounded-full ' + paymentBadgeCls + '">' + paymentStatus + '</span></td>' +
        '<td class="text-slate-400 text-xs">' + (b.last_session_date || '—') + '</td>' +
        '<td><div class="flex items-center gap-2"><button onclick="viewBookingDetail(' + b.id + ')" class="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 border border-white/10 rounded hover:border-white/25 font-body bg-transparent cursor-pointer">View</button>' + approveRejectBtns + '</div></td></tr>';
    }).join('');

  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-slate-500">An error occurred. Please try again.</td></tr>';
  }
};

// ─── Approve booking ──────────────────────────────────────────────────────────
window.approveBooking = async function(id) {
  var confirmed = await window.showConfirm({ title: 'Approve Booking', message: 'Approve booking #' + id + '? The client will be notified.', confirmText: 'Approve' });
  if (!confirmed) return;

  var loader = window.showLoading('Approving booking...');
  try {
    var res = await window.api.adminPatch('/admin/booking/approve/' + id);
    if (!res) return; // 401 already handled globally by api.js (handle401)

    // TEMPORARY: backend confirmed approve actually works but sometimes
    // returns a 2xx with an empty/unparseable body. Remove once fixed.
    // var isEmptyBodySuccess = res.ok && res.data?.message === 'Invalid server response';

    if (res.data?.success || isEmptyBodySuccess) {
      window.showToast('Booking approved successfully.', 'success');
      updateBookingRowStatus(id, 'approved');
    } else {
      window.showToast(res.data?.message || 'Failed to approve booking.', 'error');
    }
  } catch(e) {
    window.showToast('An error occurred. Please try again.', 'error');
  } finally {
    window.dismissToast(loader);
  }
};

// ─── Reject booking ───────────────────────────────────────────────────────────
window.openRejectModal = function(id) {
  var overlay = document.getElementById('reject-modal-overlay');
  var input   = document.getElementById('reject-note-input');
  if (!overlay || !input) return;
  input.value = '';
  overlay.dataset.bookingId = id;
  overlay.classList.add('open');
};

window.closeRejectModal = function() {
  var overlay = document.getElementById('reject-modal-overlay');
  if (overlay) overlay.classList.remove('open');
};

window.submitReject = async function() {
  var overlay = document.getElementById('reject-modal-overlay');
  var input   = document.getElementById('reject-note-input');
  var id      = overlay ? overlay.dataset.bookingId : null;
  var note    = input ? input.value.trim() : '';

  if (!note) { window.showToast('A rejection note is required.', 'warning'); return; }

  var loader = window.showLoading('Rejecting booking...');
  try {
    var res = await window.api.adminPatch('/admin/booking/reject/' + id, { note: note });
    if (!res) { window.closeRejectModal(); return; } // 401 already handled globally by api.js (handle401)

    window.closeRejectModal();

    // TEMPORARY: backend confirmed reject actually works but sometimes
    // returns a 2xx with an empty/unparseable body. Remove once fixed.
    // var isEmptyBodySuccess = res.ok && res.data?.message === 'Invalid server response';

    if (res.data?.success || isEmptyBodySuccess) {
      window.showToast('Booking rejected. Client has been notified.', 'success');
      updateBookingRowStatus(id, 'rejected');
    } else {
      window.showToast(res.data?.message || 'Failed to reject booking.', 'error');
    }
  } catch(e) {
    window.showToast('An error occurred. Please try again.', 'error');
  } finally {
    window.dismissToast(loader);
  }
};

function updateBookingRowStatus(id, newStatus) {
  var row = document.querySelector('tr[data-booking-id="' + id + '"]');
  if (!row) return;
  var badge = row.querySelector('.badge');
  if (badge) { badge.className = 'badge badge-' + newStatus; badge.textContent = newStatus; }
  row.querySelectorAll('button:not(:first-child)').forEach(function(b) { b.remove(); });
}

// ─── View booking detail ──────────────────────────────────────────────────────
window.viewBookingDetail = function(id) {
  var b = window._adminBookings && window._adminBookings.find(function(x) { return x.id === id; });
  if (!b) return;

  var overlay = document.getElementById('booking-modal');
  var content = document.getElementById('booking-modal-content');
  if (!overlay || !content) return;

  var pendingBtns = b.status === 'pending'
    ? '<div class="flex gap-3 pt-4 border-t border-white/5 mt-4"><button onclick="approveBooking(' + b.id + ');closeBookingModal()" class="dash-btn-primary text-xs flex-1">Approve</button><button onclick="openRejectModal(' + b.id + ');closeBookingModal()" class="dash-btn-danger text-xs flex-1">Reject</button></div>'
    : '';

  content.innerHTML =
    '<div class="grid grid-cols-2 gap-4 text-sm mb-4">' +
    '<div><p class="dash-label">Client</p><p class="text-slate-200">' + (b.name || '—') + '</p></div>' +
    '<div><p class="dash-label">Email</p><p class="text-slate-200">' + (b.email || '—') + '</p></div>' +
    '<div><p class="dash-label">Phone</p><p class="text-slate-200">' + (b.phone || '—') + '</p></div>' +
    '<div><p class="dash-label">Status</p><span class="badge badge-' + b.status + '">' + b.status + '</span></div>' +
    '<div><p class="dash-label">Service</p><p class="text-slate-200">' + (b.service ? b.service.title : '—') + '</p></div>' +
    '<div><p class="dash-label">Price</p><p class="text-green-400">' + (b.service && b.service.price ? '$' + parseFloat(b.service.price).toFixed(2) : '—') + '</p></div>' +
    '<div><p class="dash-label">Date</p><p class="text-slate-200">' + (b.date || '—') + '</p></div>' +
    '<div><p class="dash-label">Time</p><p class="text-slate-200">' + (b.time || '—') + (b.timezone ? ' (' + b.timezone + ')' : '') + '</p></div>' +
    '<div><p class="dash-label">Last Session</p><p class="text-slate-200">' + (b.last_session_date || 'First booking') + '</p></div>' +
    '<div><p class="dash-label">Booked On</p><p class="text-slate-200">' + (b.created_at ? new Date(b.created_at).toLocaleDateString() : '—') + '</p></div>' +
    '</div>' +
    (b.note ? '<div class="pt-4 border-t border-white/5"><p class="dash-label mb-1">Note</p><p class="text-slate-300 text-sm leading-relaxed">' + b.note + '</p></div>' : '') +
    pendingBtns;

  overlay.classList.add('open');
};

window.closeBookingModal = function() {
  var overlay = document.getElementById('booking-modal');
  if (overlay) overlay.classList.remove('open');
};