// dashboard.js — shared dashboard helpers for role pages.
// Every stat/recent-entry is read from the role config in login-credentials.json
// (RAM via window._login) and tree detail pulled from RAM via storage.pullTreeDetail.

function setStatById(idValue, statValue) {
  var matchingElements = document.querySelectorAll('[id="' + idValue + '"]');
  for (var index = 0; index < matchingElements.length; index++) { matchingElements[index].textContent = statValue; }
}

function getRoleConfig(roleName) {
  return (window._login && window._login['tree-login'] && window._login['tree-login'][roleName]) || {};
}

function roleRecentEntries(roleName) {
  return getRoleConfig(roleName)['recent-entries'] || [];
}

function roleTreeIds(roleName) {
  var role = getRoleConfig(roleName);
  var ids = [];
  if (role.cards) {
    ['current', 'past', 'waiting', 'rejected'].forEach(function (k) {
      ids = ids.concat(role.cards[k] || []);
    });
  } else if (role.projects) {
    Object.keys(role.projects).forEach(function (p) {
      ['current', 'past', 'waiting', 'rejected'].forEach(function (k) {
        ids = ids.concat(role.projects[p][k] || []);
      });
    });
  } else if (role.tiles) {
    if (role.tiles['my-trees']) {
      ['current', 'past', 'waiting', 'rejected'].forEach(function (k) {
        ids = ids.concat(role.tiles['my-trees'][k] || []);
      });
    }
    if (role.tiles.trees) { ids = ids.concat(role.tiles.trees); }
  }
  return ids;
}

function renderRecentEntries(listElId, roleName, openFnName) {
  var list = document.getElementById(listElId);
  if (!list) { return; }
  var entries = roleRecentEntries(roleName);
  list.innerHTML = entries.map(function (entry) {
    var t = storage.pullTreeDetail(entry.treeId);
    if (!t) { return ''; }
    var date = entry.date || '—';
    var time = entry.time || '';
    return '<div class="recent-row" style="cursor:pointer" onclick="' + openFnName + '(\'' + entry.treeId + '\')">' +
      '<div class="recent-dot" style="background:#3B6D11"></div>' +
      '<div><div class="recent-id">' + entry.treeId + '</div>' +
      '<div class="recent-date">' + date + (time ? ' · ' + time : '') + '</div></div>' +
      '<div class="recent-badge">' + (entry.badge || 'Saved') + '</div></div>';
  }).join('');
}

function countRoleLogs(roleName) {
  var ids = roleTreeIds(roleName);
  var total = 0;
  var month = 0;
  var now = new Date();
  var ym = now.getFullYear() + '-' + String(now.getMonth() + 1).replace(/^(\d)$/, '0$1');
  ids.forEach(function (id) {
    var t = storage.pullTreeDetail(id);
    if (!t || !t['encounters-list']) { return; }
    var keys = Object.keys(t['encounters-list']);
    total += keys.length;
    keys.forEach(function (k) {
      var d = (t['encounters-list'][k].updatedDate || t['encounters-list'][k].registeredDate || '');
      if (d.slice(0, 7) === ym) { month++; }
    });
  });
  return { total: total, month: month, covered: ids.length };
}

function renderLogStats(roleName) {
  var c = countRoleLogs(roleName);
  setStatById('dash-log-count', c.total);
  setStatById('dash-month-count', c.month);
  setStatById('dash-tree-count', c.covered);
}

function renderAdminDash() {
  var role = getRoleConfig('admin');
  var approved = (role.tiles && role.tiles.user && role.tiles.user.approved) || [];
  var waiting = (role.tiles && role.tiles.user && role.tiles.user.waiting) || [];
  var rangers = 0;
  var sponsors = 0;
  approved.forEach(function (userId) {
    if (String(userId).indexOf('RAN') > -1) { rangers++; }
    else if (String(userId).indexOf('SPN') > -1) { sponsors++; }
  });
  var trees = (role.tiles && role.tiles.trees) || [];
  setStatById('admin-rangers', rangers);
  setStatById('admin-rangers-waiting', waiting.length);
  setStatById('admin-sponsors', sponsors);
  setStatById('admin-sponsors-waiting', waiting.length);
  setStatById('admin-trees', trees.length);
}