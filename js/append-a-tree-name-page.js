var parentUrl = new URLSearchParams(location.search).get('parent') || 'test-bed-3.html';
function roleDash() { return parentUrl; }
function appendTreeGoTo(page) {
  if (page && /\.html/.test(page)) { window.parent.backToStart(); return; }
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  var el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
}
window.goTo = appendTreeGoTo;
window.render = { init: function () { buildAppendNameFields(); } };
goTo('append-tree-name');