var bookingState = {
  serviceId: null, serviceName: '', servicePrice: 0,
  availabilityId: null, selectedDate: null, selectedTime: null,
  selectedTimezone: null, availabilityData: null,
};

window.addEventListener('DOMContentLoaded', function() {
  initBookingServices();
  initAvailability();
  var params = new URLSearchParams(window.location.search);
  var preId  = params.get('service_id');
  if (preId) window._preSelectServiceId = parseInt(preId);
});

async function initBookingServices() {
  var services = await window.loadServices('booking-services-container');
  window._bookingServices = services;
  window.renderServiceCards(services, 'booking-services-container', true);
  if (window._preSelectServiceId) {
    var svc = services.find(function(s) { return s.id === window._preSelectServiceId; });
    if (svc) selectBookingService(svc.id, svc);
  }
  window.selectServiceCard = function(id) {
    var svc = window._bookingServices && window._bookingServices.find(function(s) { return s.id === id; });
    if (svc) selectBookingService(id, svc);
  };
}

function selectBookingService(id, svc) {
  bookingState.serviceId    = svc.id;
  bookingState.serviceName  = svc.title;
  bookingState.servicePrice = parseFloat(svc.price) || 0;
  document.querySelectorAll('.service-card').forEach(function(c) {
    var sel = parseInt(c.dataset.serviceId) === id;
    c.style.outline    = sel ? '2px solid #2D4A3E' : '';
    c.style.background = sel ? '#f0f7f4' : '';
  });
  updatePriceDisplay();
  setStepBtn(1, true);
}

async function initAvailability() {
  var loader = window.showLoading('Loading availability...');
  try {
    var res = await window.api.get('/availability');
    if (!res.data?.success) { window.showToast('Could not load availability. Please try again.', 'error'); return; }
    bookingState.availabilityData = res.data.data;
    renderAvailabilityCalendar(res.data.data);
  } catch(e) {
    window.showToast('An error occurred. Please try again.', 'error');
  } finally {
    window.dismissToast(loader);
  }
}

function renderAvailabilityCalendar(data) {
  var container = document.getElementById('availability-calendar');
  if (!container) return;
  var monthResponse       = data.monthResponse || {};
  var timeAvailableResult = data.timeAvailableResult || {};
  var timezoneByDate      = data.timezoneByDate || {};
  var availableDates      = Object.keys(monthResponse).filter(function(d) { return monthResponse[d]; });

  if (!availableDates.length) {
    container.innerHTML = '<div class="text-center py-12 text-warm-gray"><i class="fa-solid fa-calendar-xmark text-4xl mb-3 block text-mist"></i><p>No availability at the moment. Please check back soon.</p></div>';
    return;
  }

  var dateBtns = availableDates.map(function(date) {
    var label = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return '<button class="date-btn px-4 py-2 border border-gray-200 text-sm text-charcoal hover:border-sage hover:bg-ivory transition-all font-body bg-white cursor-pointer" data-date="' + date + '" onclick="selectBookingDate(\'' + date + '\')">' + label + '</button>';
  }).join('');

  container.innerHTML = '<div class="mb-6"><p class="field-label mb-3">Select a Date</p><div class="flex flex-wrap gap-2">' + dateBtns + '</div></div><div id="time-slots-container" class="hidden"><p class="field-label mb-3">Select a Time</p><div class="flex flex-wrap gap-2" id="time-buttons"></div><p class="text-xs text-warm-gray mt-2" id="timezone-label"></p></div>';
}

window.selectBookingDate = function(date) {
  bookingState.selectedDate   = date;
  bookingState.selectedTime   = null;
  bookingState.availabilityId = null;

  document.querySelectorAll('.date-btn').forEach(function(b) {
    var sel = b.dataset.date === date;
    b.style.background  = sel ? '#2D4A3E' : '';
    b.style.color       = sel ? '#FAF8F4' : '';
    b.style.borderColor = sel ? '#2D4A3E' : '';
  });

  var data   = bookingState.availabilityData;
  var slots  = data && data.timeAvailableResult ? (data.timeAvailableResult[date] || []) : [];
  var tz     = data && data.timezoneByDate ? (data.timezoneByDate[date] || '') : '';
  var timeContainer = document.getElementById('time-slots-container');
  var timeBtns      = document.getElementById('time-buttons');
  var tzLabel       = document.getElementById('timezone-label');

  if (!slots.length) { if (timeContainer) timeContainer.classList.add('hidden'); return; }
  if (timeContainer) timeContainer.classList.remove('hidden');
  if (tzLabel) tzLabel.textContent = 'Timezone: ' + tz;

  if (timeBtns) {
    timeBtns.innerHTML = slots.map(function(slot) {
      var time     = new Date(slot.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      var disabled = slot.slotsAvailable === 0;
      var cls      = disabled ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed' : 'border-gray-200 text-charcoal hover:border-sage hover:bg-ivory bg-white cursor-pointer';
      var onclick  = disabled ? '' : 'onclick="selectBookingTime(\'' + slot.time + '\', \'' + tz + '\', ' + slot.id + ')"';
      return '<button class="time-btn px-4 py-2 border text-sm font-body transition-all ' + cls + '" data-time="' + slot.time + '" ' + (disabled ? 'disabled' : '') + ' ' + onclick + '>' + time + (disabled ? ' <span class="text-xs">(Full)</span>' : '') + '</button>';
    }).join('');
  }
  setStepBtn(2, false);
};

window.selectBookingTime = function(time, tz, availabilityId) {
  bookingState.selectedTime     = time;
  bookingState.selectedTimezone = tz;
  bookingState.availabilityId   = availabilityId;
  document.querySelectorAll('.time-btn').forEach(function(b) {
    var sel = b.dataset.time === time;
    b.style.background  = sel ? '#2D4A3E' : '';
    b.style.color       = sel ? '#FAF8F4' : '';
    b.style.borderColor = sel ? '#2D4A3E' : '';
  });
  setStepBtn(2, true);
};

function updatePriceDisplay() {
  var display   = document.getElementById('price-display');
  var totalEl   = document.getElementById('live-total');
  var breakdown = document.getElementById('live-breakdown');
  if (!bookingState.serviceId || !display) return;
  display.style.display = 'block';
  if (totalEl)   totalEl.textContent   = bookingState.servicePrice ? '$' + bookingState.servicePrice.toFixed(2) : 'Custom pricing';
  if (breakdown) breakdown.textContent = bookingState.serviceName;
}

window.goToStep = function(step) {
  if (step === 2 && !bookingState.serviceId)    { window.showToast('Please select a service first.', 'warning');    return; }
  if (step === 3 && !bookingState.selectedTime) { window.showToast('Please select a date and time.', 'warning');    return; }
  if (step === 4 && !validateBookingDetails())  { return; }

  document.querySelectorAll('.booking-panel').forEach(function(p) { p.classList.remove('active'); });
  var panel = document.getElementById('panel-' + step);
  if (panel) panel.classList.add('active');

  for (var n = 1; n <= 4; n++) {
    var ind  = document.getElementById('step-' + n + '-indicator');
    var line = document.getElementById('line-' + n);
    if (!ind) continue;
    if (n < step)       { ind.className = 'step done'; ind.innerHTML = '<i class="fa-solid fa-check text-xs"></i>'; }
    else if (n === step){ ind.className = 'step active'; ind.textContent = n; }
    else                { ind.className = 'step'; ind.textContent = n; }
    if (line) line.className = n < step ? 'step-line done' : 'step-line';
  }

  if (step >= 3) populateBookingSummary();
  if (step === 4) populatePaymentSummary();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function populateBookingSummary() {
  var nameEl  = document.getElementById('summary-service-name');
  var priceEl = document.getElementById('summary-service-price');
  var dateEl  = document.getElementById('summary-date-time');
  if (nameEl)  nameEl.textContent  = bookingState.serviceName;
  if (priceEl) priceEl.textContent = bookingState.servicePrice ? '$' + bookingState.servicePrice.toFixed(2) : 'Custom pricing';
  if (dateEl && bookingState.selectedTime) {
    dateEl.textContent = new Date(bookingState.selectedTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
}

function populatePaymentSummary() {
  var map = {
    'payment-service-name':  bookingState.serviceName,
    'payment-service-price': bookingState.servicePrice ? '$' + bookingState.servicePrice.toFixed(2) : 'Custom pricing',
    'payment-total':         bookingState.servicePrice ? '$' + bookingState.servicePrice.toFixed(2) : 'Custom pricing',
    'pay-amount':            bookingState.servicePrice ? '$' + bookingState.servicePrice.toFixed(2) : '',
  };
  Object.keys(map).forEach(function(id) { var el = document.getElementById(id); if (el) el.textContent = map[id]; });
}

function setStepBtn(step, enabled) {
  var btn = document.getElementById('step' + step + '-next');
  if (!btn) return;
  btn.disabled  = !enabled;
  btn.className = enabled ? 'btn-primary' : 'btn-primary opacity-40 cursor-not-allowed';
}

function validateBookingDetails() {
  var form = document.getElementById('details-form');
  if (!form) return true;
  window.clearAllFieldErrors(form);
  var valid = true;
  var name  = document.getElementById('client-name');
  var email = document.getElementById('client-email');
  var phone = document.getElementById('client-phone');
  if (!name  || !name.value.trim())  { window.showFieldError(name,  'Name is required');         valid = false; }
  if (!email || !email.value.trim()) { window.showFieldError(email, 'Email is required');         valid = false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { window.showFieldError(email, 'Enter a valid email'); valid = false; }
  if (!phone || !phone.value.trim()) { window.showFieldError(phone, 'Phone number is required');  valid = false; }
  return valid;
}

window.submitBooking = async function() {
  if (!validateBookingDetails()) return;
  var btn    = document.getElementById('pay-btn');
  var loader = window.showLoading('Processing your booking...');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Processing...'; }

  try {
    var phone   = window.sanitizePhone(document.getElementById('client-phone') ? document.getElementById('client-phone').value : '');
    var payload = {
      name:            document.getElementById('client-name')  ? document.getElementById('client-name').value.trim()  : '',
      email:           document.getElementById('client-email') ? document.getElementById('client-email').value.trim() : '',
      phone:           phone,
      service_id:      bookingState.serviceId,
      availability_id: bookingState.availabilityId,
      note:            document.getElementById('client-note')  ? document.getElementById('client-note').value.trim()  : '',
    };
    var lastSessionDate = window.getClientLastSession();
    if (lastSessionDate) payload.last_session_date = lastSessionDate;
    payload.payment_status_frontend_url = window.location.origin + '/confirmation.html';

    console.log('[DEBUG] submitBooking payload:', payload);

    var res = await window.api.post('/booking/create', payload);

    // DEBUG: log the exact raw response so it's visible without opening
    // the Network tab manually. Safe to remove once diagnosis is done.
  

    if (res.data?.success) {
      window.saveClientLastSession(new Date().toISOString().split('T')[0]);
      var paymentUrl = res.data?.data?.payment_url;
      if (paymentUrl) {
        window.showToast('Booking submitted! Redirecting you to payment...', 'success', 3000);
        setTimeout(function() { window.location.href = paymentUrl; }, 1200);
      } else {
        // Fallback: no payment_url returned — go straight to confirmation
        // instead of leaving the user stuck with no redirect.
        window.showToast('Booking submitted! You will receive a confirmation email once approved.', 'success', 6000);
        setTimeout(function() { window.navigateTo('/confirmation.html'); }, 1800);
      }
    } else if (res.status === 409) {
      window.showToast('That time slot is now fully booked. Please select a different time.', 'error', 6000);
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-lock text-sm"></i> Confirm & Pay'; }
    } else if (res.status === 404) {
      window.showToast('Service or time slot not found. Please start over.', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-lock text-sm"></i> Confirm & Pay'; }
    } else {
      window.showToast(res.data?.message || 'Booking failed. Please try again.', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-lock text-sm"></i> Confirm & Pay'; }
    }
  } catch(e) {
    console.log('[DEBUG] submitBooking caught error:', e);
    window.showToast('An error occurred. Please try again.', 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-lock text-sm"></i> Confirm & Pay'; }
  } finally {
    window.dismissToast(loader);
  }
};