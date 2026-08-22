var parentUrl = new URLSearchParams(location.search).get('parent') || 'test-bed-2.html';
window._surveyUserId = new URLSearchParams(location.search).get('userid') || '';
window._surveyTreeId = new URLSearchParams(location.search).get('treeid') || '';

function roleDash() {
  return parentUrl;
}

function surveyGoTo(page) {
  if (page && /\.html/.test(page)) { window.parent.backToStart(); return; }
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  var el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  if (page === 'selfie') { refreshGisMap(); }
  if (page === 'snapshots') { renderSurveySnapGrid(); }
  if (page === 'capture') { renderSurveyCapturePage(); }
}
window.goTo = surveyGoTo;
goTo('selfie');