var loadedPanels = { overview: true };
var panelTitles = {
  overview: 'Overview', bookings: 'Bookings', services: 'Services',
  availability: 'Availability', 'contact-emails': 'Contact Emails', settings: 'Account Settings'
};

window.switchPanel = function(name) {
  document.querySelectorAll('.dash-panel').forEach(function(p) { p.classList.remove('active'); });
  var panel = document.getElementById('panel-' + name);
  if (panel) panel.classList.add('active');

  document.querySelectorAll('.dash-nav-item').forEach(function(btn) {
    var oc = btn.getAttribute('onclick') || '';
    btn.classList.toggle('active', oc.indexOf("'" + name + "'") !== -1);
  });

  var titleEl = document.getElementById('panel-title');
  if (titleEl) titleEl.textContent = panelTitles[name] || name;

  if (!loadedPanels[name]) {
    if (name === 'bookings'       && window.loadBookings)          void window.loadBookings();
    if (name === 'services'       && window.loadAdminServices)     void window.loadAdminServices();
    if (name === 'availability'   && window.loadAdminAvailability) void window.loadAdminAvailability();
    if (name === 'contact-emails' && window.loadContactEmails)     void window.loadContactEmails();
    loadedPanels[name] = true;
  }

  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (overlay) overlay.classList.add('hidden');
};

window.toggleSidebar = function() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  if (!sidebar) return;
  var isOpen = sidebar.classList.contains('mobile-open');
  sidebar.classList.toggle('mobile-open', !isOpen);
  if (overlay) overlay.classList.toggle('hidden', isOpen);
};

window.handleAdminLogout = function() { window.adminLogout(); };

window.toggleLoginPw = function() {
  var input = document.getElementById('login-password');
  var icon  = document.getElementById('login-eye-icon');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  if (icon) icon.className = input.type === 'password' ? 'fa-solid fa-eye text-sm' : 'fa-solid fa-eye-slash text-sm';
};

window.addEventListener('DOMContentLoaded', function() {
  if (!window.requireAdminAuth()) return;
  var dateEl = document.getElementById('overview-date');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  window.addTimeSlotRow && window.addTimeSlotRow();
  void (window.loadBookingOverview && window.loadBookingOverview());
  void (window.loadAdminInfo && window.loadAdminInfo());
});