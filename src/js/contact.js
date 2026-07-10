window.handleContactForm = async function(e) {
  e.preventDefault();
  var form = e.target;
  window.clearAllFieldErrors(form);

  var name    = document.getElementById('contact-name');
  var email   = document.getElementById('contact-email');
  var subject = document.getElementById('contact-subject');
  var message = document.getElementById('contact-message');
  var valid   = true;

  if (!name || !name.value.trim())       { window.showFieldError(name,    'Name is required');    valid = false; }
  if (!email || !email.value.trim())     { window.showFieldError(email,   'Email is required');   valid = false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { window.showFieldError(email, 'Enter a valid email'); valid = false; }
  if (!subject || !subject.value.trim()) { window.showFieldError(subject, 'Subject is required'); valid = false; }
  if (!message || !message.value.trim()) { window.showFieldError(message, 'Message is required'); valid = false; }
  if (!valid) return;

  var btn  = form.querySelector('button[type="submit"]');
  var orig = btn ? btn.textContent : '';
  if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }

  var loader = window.showLoading('Sending your message...');
  try {
    var res = await window.api.post('/contact', {
      name:    name.value.trim(),
      email:   email.value.trim(),
      subject: subject.value.trim(),
      message: message.value.trim(),
    });

    if (res.data?.success) {
      window.showToast('Message sent! We will get back to you soon.', 'success');
      form.reset();
    } else if (res.status === 404) {
      window.showToast('Unable to send message right now. Please try again later.', 'error');
    } else {
      window.showToast(res.data?.message || 'Failed to send message.', 'error');
    }
  } catch(e) {
    window.showToast('An error occurred. Please try again.', 'error');
  } finally {
    window.dismissToast(loader);
    if (btn) { btn.disabled = false; btn.textContent = orig; }
  }
};