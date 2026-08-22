var parentUrl = new URLSearchParams(location.search).get('parent') || 'test-bed-2.html';
window._registerUserId = new URLSearchParams(location.search).get('userid') || '';
window._registerTreeId = new URLSearchParams(location.search).get('treeid') || '';

function roleDash() {
  return parentUrl;
}

function registerGoTo(page) {
  if (page && /\.html/.test(page)) { window.parent.backToStart(); return; }
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  var el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  if (page === 'selfie') { refreshGisMap(); }
  if (page === 'snapshots') { renderRegisterSnapGrid(); }
  if (page === 'capture') { renderRegisterCapturePage(); }
}
window.goTo = registerGoTo;
goTo('selfie');