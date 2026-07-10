// ─── Load services ────────────────────────────────────────────────────────────
window.loadAdminServices = async function() {
  var container = document.getElementById('services-list');
  if (!container) return;
  container.innerHTML = '<div class="col-span-full text-center py-8 text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading services...</div>';

  try {
    var res = await window.api.get('/services/list');
    if (!res?.data?.success) {
      container.innerHTML = '<div class="col-span-full text-center py-8 text-slate-500">Failed to load services.</div>';
      return;
    }

    var services = res.data.data || [];
    window._adminServices = services;

    if (!services.length) {
      container.innerHTML = '<div class="col-span-full text-center py-8 text-slate-500">No services yet. Add your first service.</div>';
      return;
    }

    container.innerHTML = services.map(function(s) {
      return '<div class="bg-[#161b27] border border-white/5 rounded-xl overflow-hidden hover:border-sage/30 transition-colors" data-service-id="' + s.id + '">' +
        '<div class="h-40 overflow-hidden relative">' +
        '<img src="' + (s.picture || '') + '" alt="' + s.title + '" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML=\'<div class=\\\'w-full h-full bg-sage/10 flex items-center justify-center\\\'><i class=\\\'fa-solid fa-image text-slate-600 text-3xl\\\'></i></div>\'"/>' +
        '<span class="absolute top-3 left-3 badge badge-' + (s.type === 'corporate' ? 'corporate' : 'personal') + '">' + s.type + '</span>' +
        '</div>' +
        '<div class="p-5">' +
        '<div class="flex items-start justify-between mb-2"><h4 class="text-slate-200 font-medium text-sm leading-tight flex-1 pr-2">' + s.title + '</h4><p class="text-green-400 font-semibold text-sm shrink-0">$' + parseFloat(s.price).toFixed(2) + '</p></div>' +
        '<p class="text-slate-500 text-xs leading-relaxed mb-2">' + s.description + '</p>' +
        (s.duration ? '<p class="text-slate-500 text-xs mb-4"><i class="fa-regular fa-clock mr-1"></i>' + s.duration + '</p>' : '<div class="mb-4"></div>') +
        '<div class="flex gap-2 pt-3 border-t border-white/5">' +
        '<button onclick="openEditServiceModal(' + s.id + ')" class="dash-btn-ghost text-xs py-1.5 flex-1"><i class="fa-solid fa-pen mr-1"></i>Edit</button>' +
        '<button onclick="deleteService(' + s.id + ')" class="dash-btn-danger text-xs py-1.5 px-3"><i class="fa-solid fa-trash"></i></button>' +
        '</div></div></div>';
    }).join('');

  } catch(e) {
    container.innerHTML = '<div class="col-span-full text-center py-8 text-slate-500">An error occurred. Please try again.</div>';
  }
};

window.openCreateServiceModal = function() {
  document.getElementById('service-modal-title').textContent = 'Add New Service';
  document.getElementById('service-form').reset();
  document.getElementById('service-edit-id').value = '';
  document.getElementById('service-image-preview').innerHTML = '';
  document.getElementById('service-modal').classList.add('open');
};

window.openEditServiceModal = function(id) {
  var svc = window._adminServices && window._adminServices.find(function(s) { return s.id === id; });
  if (!svc) return;
  document.getElementById('service-modal-title').textContent = 'Edit Service';
  document.getElementById('service-edit-id').value   = svc.id;
  document.getElementById('svc-title').value         = svc.title;
  document.getElementById('svc-description').value   = svc.description;
  document.getElementById('svc-price').value         = svc.price;
  document.getElementById('svc-type').value          = svc.type;
  document.getElementById('svc-duration').value       = svc.duration || '';
  var preview = document.getElementById('service-image-preview');
  if (svc.picture) {
    preview.innerHTML = '<img src="' + svc.picture + '" alt="Current" class="w-full h-32 object-cover rounded-lg mt-2 border border-white/10"/>';
  } else {
    preview.innerHTML = '';
  }
  document.getElementById('service-modal').classList.add('open');
};

window.closeServiceModal = function() {
  var modal = document.getElementById('service-modal');
  if (modal) modal.classList.remove('open');
};

window.saveService = async function(e) {
  e.preventDefault();
  var editId   = document.getElementById('service-edit-id').value;
  var title    = document.getElementById('svc-title').value.trim();
  var desc     = document.getElementById('svc-description').value.trim();
  var price    = document.getElementById('svc-price').value;
  var type     = document.getElementById('svc-type').value;
  var duration = document.getElementById('svc-duration').value.trim();
  var picInput = document.getElementById('svc-picture');
  var picFile  = picInput && picInput.files[0];

  if (!title || !desc || !price || !type || !duration) { window.showToast('Please fill in all required fields.', 'warning'); return; }
  if (!editId && !picFile) { window.showToast('Please select an image for the service.', 'warning'); return; }

  var fd = new FormData();
  fd.append('title', title);
  fd.append('description', desc);
  fd.append('price', price);
  fd.append('type', type);
  fd.append('duration', duration);
  if (picFile) fd.append('picture', picFile);

  var loader = window.showLoading(editId ? 'Updating service...' : 'Creating service...');
  try {
    var res = editId
      ? await window.api.adminForm('/admin/services/edit/' + editId, fd, 'POST')
      : await window.api.adminForm('/admin/services/create', fd, 'POST');

    if (!res) return; // 401 already handled globally by api.js (handle401)

    if ((res.status === 200 || res.status === 201) && res.data?.success) {
      window.showToast(editId ? 'Service updated successfully.' : 'Service created successfully.', 'success');
      window.closeServiceModal();
      void window.loadAdminServices();
    } else {
      window.showToast(res.data?.message || 'Failed to save service.', 'error');
    }
  } catch(e) {
    window.showToast('An error occurred. Please try again.', 'error');
  } finally {
    window.dismissToast(loader);
  }
};

window.deleteService = async function(id) {
  var svc = window._adminServices && window._adminServices.find(function(s) { return s.id === id; });
  var confirmed = await window.showConfirm({ title: 'Delete Service', message: 'Delete "' + (svc ? svc.title : 'this service') + '"? This cannot be undone.', confirmText: 'Delete', danger: true });
  if (!confirmed) return;

  var loader = window.showLoading('Deleting service...');
  try {
    var res = await window.api.adminDelete('/admin/services/delete/' + id);
    if (!res) return; // 401 already handled globally by api.js (handle401)

    if (res.data?.success) {
      window.showToast('Service deleted.', 'success');
      var card = document.querySelector('[data-service-id="' + id + '"]');
      if (card) card.remove();
      if (window._adminServices) window._adminServices = window._adminServices.filter(function(s) { return s.id !== id; });
    } else {
      window.showToast(res.data?.message || 'Failed to delete service.', 'error');
    }
  } catch(e) {
    window.showToast('An error occurred. Please try again.', 'error');
  } finally {
    window.dismissToast(loader);
  }
};

window.previewServiceImage = function(input) {
  var preview = document.getElementById('service-image-preview');
  if (!preview || !input.files[0]) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    preview.innerHTML = '<img src="' + e.target.result + '" alt="Preview" class="w-full h-32 object-cover rounded-lg mt-2 border border-white/10"/>';
  };
  reader.readAsDataURL(input.files[0]);
};