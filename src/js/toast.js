// ─── Toast container ──────────────────────────────────────────────────────────
var _toastContainer = null;

function getToastContainer() {
  if (!_toastContainer) {
    _toastContainer = document.createElement('div');
    _toastContainer.id = 'toast-container';
    _toastContainer.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;max-width:360px;width:calc(100% - 48px);';
    document.body.appendChild(_toastContainer);
  }
  return _toastContainer;
}

// ─── Show toast ───────────────────────────────────────────────────────────────
window.showToast = function(message, type, duration) {
  type = type || 'success';
  duration = duration !== undefined ? duration : 4000;

  var colors = {
    success: { bg: '#1e3229', border: 'rgba(45,74,62,.6)',   icon: 'fa-circle-check',        iconColor: '#86efac' },
    error:   { bg: '#2d1515', border: 'rgba(239,68,68,.4)',  icon: 'fa-circle-xmark',        iconColor: '#fca5a5' },
    warning: { bg: '#2d2015', border: 'rgba(234,179,8,.4)',  icon: 'fa-triangle-exclamation', iconColor: '#fde047' },
    info:    { bg: '#152030', border: 'rgba(96,165,250,.4)', icon: 'fa-circle-info',          iconColor: '#93c5fd' },
    loading: { bg: '#1e2530', border: 'rgba(200,216,208,.3)',icon: 'fa-spinner fa-spin',      iconColor: '#C8D8D0' },
  };

  var cfg = colors[type] || colors.info;
  var c   = getToastContainer();
  var toast = document.createElement('div');
  toast.style.cssText = 'background:' + cfg.bg + ';border:1px solid ' + cfg.border + ';border-radius:8px;padding:14px 16px;display:flex;align-items:flex-start;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,.3);font-family:Poppins,sans-serif;opacity:0;transform:translateX(20px);transition:opacity .35s,transform .35s;';

  // Build icon + close button via innerHTML (static, safe), but insert the
  // message text via textContent so any HTML/script characters in it are
  // rendered as plain text instead of being parsed as markup.
  toast.innerHTML = '<i class="fa-solid ' + cfg.icon + '" style="color:' + cfg.iconColor + ';font-size:15px;margin-top:1px;flex-shrink:0;"></i><p style="color:#e2e8f0;font-size:13px;line-height:1.5;flex:1;margin:0;"></p><button onclick="this.parentElement.remove()" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:14px;padding:0;margin-left:4px;flex-shrink:0;">✕</button>';
  toast.querySelector('p').textContent = message;

  c.appendChild(toast);
  setTimeout(function() { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; }, 10);

  if (type !== 'loading' && duration > 0) {
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(function() { if (toast.parentElement) toast.remove(); }, 350);
    }, duration);
  }

  return toast;
};

window.showLoading = function(message) {
  return window.showToast(message || 'Loading...', 'loading', 0);
};

window.dismissToast = function(toastEl) {
  if (!toastEl) return;
  toastEl.style.opacity = '0';
  toastEl.style.transform = 'translateX(20px)';
  setTimeout(function() { if (toastEl.parentElement) toastEl.remove(); }, 350);
};

// ─── Custom confirm dialog ────────────────────────────────────────────────────
window.showConfirm = function(options) {
  return new Promise(function(resolve) {
    var title       = options.title || 'Confirm';
    var message     = options.message || 'Are you sure?';
    var confirmText = options.confirmText || 'Confirm';
    var cancelText  = options.cancelText || 'Cancel';
    var danger      = options.danger || false;
    var btnColor    = danger ? '#C4622D' : '#2D4A3E';

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML = '<div style="background:#161b27;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:32px;width:100%;max-width:420px;font-family:Poppins,sans-serif;"><h3 style="color:#e2e8f0;font-size:18px;font-weight:600;margin:0 0 10px;">' + title + '</h3><p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">' + message + '</p><div style="display:flex;gap:10px;justify-content:flex-end;"><button id="confirm-cancel-btn" style="background:transparent;border:1px solid rgba(255,255,255,.15);color:#94a3b8;padding:9px 20px;border-radius:6px;font-family:Poppins,sans-serif;font-size:13px;cursor:pointer;">' + cancelText + '</button><button id="confirm-ok-btn" style="background:' + btnColor + ';border:none;color:white;padding:9px 20px;border-radius:6px;font-family:Poppins,sans-serif;font-size:13px;cursor:pointer;">' + confirmText + '</button></div></div>';

    document.body.appendChild(overlay);

    function close(result) {
      overlay.style.opacity = '0';
      setTimeout(function() { overlay.remove(); resolve(result); }, 200);
    }

    overlay.querySelector('#confirm-ok-btn').addEventListener('click', function() { close(true); });
    overlay.querySelector('#confirm-cancel-btn').addEventListener('click', function() { close(false); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(false); });
  });
};

// ─── Field error helpers ──────────────────────────────────────────────────────
window.showFieldError = function(inputEl, message) {
  window.clearFieldError(inputEl);
  inputEl.style.borderColor = '#ef4444';
  var err = document.createElement('p');
  err.className = 'field-error-msg';
  err.style.cssText = 'color:#ef4444;font-size:11px;margin-top:4px;font-family:Poppins,sans-serif;';
  err.textContent = message;
  inputEl.parentElement.appendChild(err);
};

window.clearFieldError = function(inputEl) {
  inputEl.style.borderColor = '';
  var existing = inputEl.parentElement.querySelector('.field-error-msg');
  if (existing) existing.remove();
};

window.clearAllFieldErrors = function(formEl) {
  formEl.querySelectorAll('.field-error-msg').forEach(function(e) { e.remove(); });
  formEl.querySelectorAll('input, select, textarea').forEach(function(i) { i.style.borderColor = ''; });
};