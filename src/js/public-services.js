window.loadServices = async function(containerId, filter) {
  var container = document.getElementById(containerId);
  if (!container) return [];
  var loader = window.showLoading('Loading services...');
  try {
    var path = filter ? '/services/list?type=' + filter : '/services/list';
    var res  = await window.api.get(path);
    if (!res?.data?.success) { window.showToast('Could not load services. Please try again.', 'error'); return []; }
    return res.data.data || [];
  } catch(e) {
    window.showToast('An error occurred. Please try again.', 'error');
    return [];
  } finally {
    window.dismissToast(loader);
  }
};

window.renderServiceCards = function(services, containerId, onSelect) {
  var container = document.getElementById(containerId);
  if (!container) return;
  if (!services.length) {
    container.innerHTML = '<div class="col-span-full text-center py-16 text-warm-gray"><i class="fa-solid fa-spa text-4xl mb-4 block text-mist"></i><p>No services available yet. Check back soon.</p></div>';
    return;
  }
  container.innerHTML = services.map(function(s) {
    var price    = s.price ? '$' + parseFloat(s.price).toFixed(2) : 'Contact for pricing';
    var clickFn  = onSelect ? 'window.selectServiceCard(' + s.id + ')' : "window.location.href='booking.html?service_id=" + s.id + "'";
    return '<div class="service-card cursor-pointer" data-service-id="' + s.id + '" onclick="' + clickFn + '">' +
      '<div class="h-52 overflow-hidden"><img src="' + (s.picture || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80') + '" alt="' + s.title + '" class="w-full h-full object-cover transition-transform duration-700 hover:scale-105" onerror="this.src=\'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80\'"/></div>' +
      '<div class="p-7"><div class="flex items-center justify-between mb-1"><span class="text-xs text-warm-gray uppercase tracking-wider">' + s.type + '</span><span class="text-xs text-ember font-medium">' + price + '</span></div>' +
      '<h3 class="font-display text-2xl mt-2 mb-3">' + s.title + '</h3>' +
      '<p class="text-warm-gray text-sm leading-relaxed mb-3">' + s.description + '</p>' +
      (s.duration ? '<p class="text-xs text-warm-gray mb-5"><i class="fa-regular fa-clock mr-1.5"></i>' + s.duration + '</p>' : '<div class="mb-5"></div>') +
      '<div class="flex items-center justify-between pt-4 border-t border-gray-100"><span class="text-xs text-warm-gray capitalize">' + s.type + ' session</span>' +
      '<span class="text-xs text-sage font-medium flex items-center gap-1.5">' + (onSelect ? 'Select' : 'Book') + ' <i class="fa-solid fa-arrow-right text-xs"></i></span></div></div></div>';
  }).join('');
};