// ─── Load availability list ───────────────────────────────────────────────────
window.loadAdminAvailability = async function() {
  var container = document.getElementById('availability-list');
  if (!container) return;
  container.innerHTML = '<div class="text-center py-8 text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading availability...</div>';

  try {
    var res = await window.api.get('/availability');
    if (!res.data?.success) {
      container.innerHTML = '<div class="text-center py-8 text-slate-500">Failed to load availability.</div>';
      return;
    }

    var data = res.data.data;
    var monthResponse       = data.monthResponse || {};
    var timeAvailableResult = data.timeAvailableResult || {};
    var timezoneByDate      = data.timezoneByDate || {};
    var dates = Object.keys(monthResponse);

    if (!dates.length) {
      container.innerHTML = '<div class="text-center py-8 text-slate-500">No availability set yet. Add a date below.</div>';
      return;
    }

    container.innerHTML = dates.map(function(date) {
      var slots = timeAvailableResult[date] || [];
      var tz    = timezoneByDate[date] || '';
      var slotsHtml = slots.map(function(slot) {
        var time      = new Date(slot.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        var deleteBtn = slot.id ? '<button onclick="deleteAvailabilitySlot(' + slot.id + ')" class="text-red-400 hover:text-red-300 ml-1 bg-transparent border-none cursor-pointer text-xs">✕</button>' : '';
        return '<span class="inline-flex items-center gap-2 bg-sage/10 border border-sage/20 text-mist text-xs px-3 py-1.5 rounded-full">' + time + ' <span class="text-slate-500">(' + slot.slotsAvailable + ' slots)</span>' + deleteBtn + '</span>';
      }).join('');

      // Date already comes as YYYY-MM-DD from API
      return '<div class="bg-[#161b27] border border-white/5 rounded-xl p-5 mb-3" data-date="' + date + '">' +
        '<div class="flex items-center justify-between mb-3">' +
        '<div><p class="text-slate-200 text-sm font-medium">' + new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + '</p>' +
        '<p class="text-slate-500 text-xs mt-0.5">' + tz + '</p></div>' +
        '<button onclick="deleteAvailabilityDate(\'' + date + '\')" class="dash-btn-danger text-xs"><i class="fa-solid fa-trash mr-1"></i>Delete Day</button>' +
        '</div><div class="flex flex-wrap gap-2">' + slotsHtml + '</div></div>';
    }).join('');

  } catch(e) {
    container.innerHTML = '<div class="text-center py-8 text-slate-500">An error occurred. Please try again.</div>';
  }
};

// ─── Add time slot row ────────────────────────────────────────────────────────
window.addTimeSlotRow = function() {
  var container = document.getElementById('time-slot-rows');
  if (!container) return;
  var row = document.createElement('div');
  row.className = 'flex items-center gap-2 mb-2';
  row.innerHTML = '<input type="time" class="dash-input flex-1 slot-time-input" /><button type="button" onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-300 px-2 bg-transparent border-none cursor-pointer"><i class="fa-solid fa-xmark"></i></button>';
  container.appendChild(row);
};

// ─── Save availability ────────────────────────────────────────────────────────
window.saveAvailability = async function(e) {
  e.preventDefault();
  var date      = document.getElementById('avail-date').value;
  var timezone  = document.getElementById('avail-timezone').value;
  var slotCount = document.getElementById('avail-slot-count').value;
  var timeInputs = document.querySelectorAll('.slot-time-input');
  var times = [];
  timeInputs.forEach(function(i) { if (i.value) times.push(i.value); });

  if (!date)         { window.showToast('Please select a date.', 'warning'); return; }
  if (!timezone)     { window.showToast('Please select a timezone.', 'warning'); return; }
  if (!slotCount)    { window.showToast('Please enter number of slots.', 'warning'); return; }
  if (!times.length) { window.showToast('Please add at least one time.', 'warning'); return; }

  var loader = window.showLoading('Saving availability...');
  try {
    var res = await window.api.adminPost('/admin/availability/save', {
      date: date,           // YYYY-MM-DD format from date input
      timezone: timezone,
      slot_count: parseInt(slotCount),
      times: times,
    });
    if (!res) return; // 401 already handled globally by api.js (handle401)

    if (res.data?.success) {
      window.showToast('Availability saved successfully.', 'success');
      document.getElementById('availability-form').reset();
      document.getElementById('time-slot-rows').innerHTML = '';
      window.addTimeSlotRow();
      void window.loadAdminAvailability();
    } else {
      window.showToast(res.data?.message || 'Failed to save availability.', 'error');
    }
  } catch(e) {
    window.showToast('An error occurred. Please try again.', 'error');
  } finally {
    window.dismissToast(loader);
  }
};

// ─── Delete single slot ───────────────────────────────────────────────────────
window.deleteAvailabilitySlot = async function(id) {
  var confirmed = await window.showConfirm({ title: 'Delete Time Slot', message: 'Remove this specific time slot?', confirmText: 'Delete', danger: true });
  if (!confirmed) return;

  var loader = window.showLoading('Deleting slot...');
  try {
    var res = await window.api.adminDelete('/admin/availability/delete/id/' + id);
    if (!res) return; // 401 already handled globally by api.js (handle401)

    if (res.data?.success) {
      window.showToast('Time slot deleted.', 'success');
      void window.loadAdminAvailability();
    } else {
      window.showToast(res.data?.message || 'Failed to delete slot.', 'error');
    }
  } catch(e) {
    window.showToast('An error occurred. Please try again.', 'error');
  } finally {
    window.dismissToast(loader);
  }
};

// ─── Delete all slots for a date — date is already YYYY-MM-DD from API ────────
window.deleteAvailabilityDate = async function(date) {
  var confirmed = await window.showConfirm({ title: 'Delete Entire Day', message: 'Remove all availability for ' + new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + '? This cannot be undone.', confirmText: 'Delete Day', danger: true });
  if (!confirmed) return;

  var loader = window.showLoading('Deleting day...');
  try {
    // date is YYYY-MM-DD as per API docs
    var res = await window.api.adminDelete('/admin/availability/delete/date/' + date);
    if (!res) return; // 401 already handled globally by api.js (handle401)

    if (res.data?.success) {
      window.showToast('Day deleted successfully.', 'success');
      var card = document.querySelector('[data-date="' + date + '"]');
      if (card) card.remove();
    } else {
      window.showToast(res.data?.message || 'Failed to delete day.', 'error');
    }
  } catch(e) {
    window.showToast('An error occurred. Please try again.', 'error');
  } finally {
    window.dismissToast(loader);
  }
};