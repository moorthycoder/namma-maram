
var TESTING_MODE = true;
var sponsoredCount = 2;
var caredCount = 4;
var logoutTarget = 'admin-login';

function loadCurrentUser() {
  try {
    var s = sessionStorage.getItem('loginCredentialsV1');
    if (!s) { return; }
    var cred = JSON.parse(s);
    var role = cred['tree-login'] && cred['tree-login']['admin'];
    if (!role) { return; }
    var nameEl = document.getElementById('user-name');
    var avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = role.name;
    if (avatarEl) avatarEl.textContent = role.avatar;
    window._login = cred;
  } catch (e) {}
}
loadCurrentUser();

var loginStatusData = {
  waiting:   { icon:'ti ti-clock',        color:'#f59e0b', bg:'#fef3c7', title:'Application under review',  text:'Your login request is waiting for admin approval. We will notify you once it is reviewed.' },
  rejected:  { icon:'ti ti-x',            color:'#dc2626', bg:'#fee2e2', title:'Application rejected',      text:'Your login request was rejected. Please contact support if you think this is a mistake.' },
  approved:  { icon:'ti ti-check',        color:'#16a34a', bg:'#dcfce7', title:'Login approved',            text:'Welcome! Your login was approved. You can now continue to your dashboard.' },
  withdrawn: { icon:'ti ti-user-off',     color:'#64748b', bg:'#e2e8f0', title:'Access withdrawn',          text:'Your access has been withdrawn. Please contact the administrator for details.' }
};

var registerStatusData = {
  waiting:          { icon:'ti ti-clock',       color:'#f59e0b', bg:'#fef3c7', title:'Application under review',  text:'Your registration is waiting for admin approval. We will notify you once it is reviewed.', go:'Login' },
  existing_member:  { icon:'ti ti-user-check',  color:'#16a34a', bg:'#dcfce7', title:'Already registered',        text:'An account with this email already exists. Please log in instead of registering again.', go:'Login', to:'admin-login' },
  blocked:          { icon:'ti ti-ban',         color:'#dc2626', bg:'#fee2e2', title:'Registration blocked',       text:'Your registration has been blocked. Please contact support if you think this is a mistake.', go:'Contact us', to:'admin-login' }
};

// Register status modal — waiting / existing_member / blocked
var regTarget = 'admin-login';

function showRegisterStatus(status, page) {
  if (page) regTarget = page;
  var d = registerStatusData[status] || registerStatusData.waiting;
  if (d.to) regTarget = d.to;
  var icon = document.getElementById('rsm-icon');
  icon.style.background = d.bg;
  icon.style.color = d.color;
  icon.innerHTML = '<i class="' + d.icon + '" style="font-size:24px;"></i>';
  document.getElementById('rsm-title').textContent = d.title;
  document.getElementById('rsm-text').textContent = d.text;
  var ok = document.getElementById('rsm-ok-btn');
  if (status === 'existing_member') {
    ok.innerHTML = '<i class="ti ti-login"></i> ' + d.go;
  } else {
    ok.innerHTML = '<i class="ti ti-check"></i> Okay';
  }
  if (status === 'blocked') {
    ok.style.background = '#dc2626';
  } else {
    ok.style.background = 'var(--color-theme)';
  }
  var test = document.getElementById('rsm-test');
  if (test) test.style.display = TESTING_MODE ? 'block' : 'none';
  document.getElementById('register-status-modal').classList.add('open');
}



function closeRegisterStatus(go) {
  document.getElementById('register-status-modal').classList.remove('open');
  if (go) goTo(regTarget);
}


// Google OAuth — simulates result in TESTING_MODE, else real OAuth redirect

function googleAuth(page, status) {
  status = status || (TESTING_MODE ? 'approved' : null);
  if (TESTING_MODE) {
    showLoginStatus(page, status);
    return;
  }
  var clientId = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
  var redirect = encodeURIComponent(window.location.origin + window.location.pathname);
  window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=' + clientId +
    '&redirect_uri=' + redirect + '&response_type=code&scope=openid%20email%20profile';
}


// Open the shared role login page (Care-giver, Ten Tree Ranger, Surveyor)
var currentRole = 'care-giver';



function roleDash() {
  return currentRole === 'surveyor' ? 'surveyor-dash' : 'ranger-dash';
}


// Show login-result modal based on status

function showLoginStatus(page, status) {
  var d = loginStatusData[status] || loginStatusData.waiting;
  var icon = document.getElementById('lsm-icon');
  icon.style.background = d.bg;
  icon.style.color = d.color;
  icon.innerHTML = '<i class="' + d.icon + '" style="font-size:24px;"></i>';
  document.getElementById('lsm-title').textContent = d.title;
  document.getElementById('lsm-text').textContent = d.text;
  var test = document.getElementById('lsm-test');
  if (test) test.style.display = TESTING_MODE ? 'block' : 'none';
  logoutTarget = page;
  document.getElementById('login-status-modal').classList.add('open');
}



function closeLoginStatus(go) {
  document.getElementById('login-status-modal').classList.remove('open');
  if (go) goTo(logoutTarget);
}


// Font size (S/M/L) — text-only scaling via root html font-size (all fonts are rem)
var fontSizeLevel = 1; // 0=S, 1=M, 2=L
var fontLevels = [
  { label:'S', mul:0.85 },
  { label:'M', mul:1.0 },
  { label:'L', mul:1.15 }
];

function fontSize(dir) {
  if (dir === 'up') { if (fontSizeLevel < 2) fontSizeLevel++; }
  else { if (fontSizeLevel > 0) fontSizeLevel--; }
  applyFontSize();
}

function applyFontSize() {
  var lv = fontLevels[fontSizeLevel];
  document.getElementById('fs-val').textContent = lv.label;
  document.getElementById('fs-minus').disabled = fontSizeLevel === 0;
  document.getElementById('fs-plus').disabled = fontSizeLevel === 2;
  document.documentElement.style.fontSize = (15 * lv.mul) + 'px';
}

function pickLang(tile, name) {
  document.querySelectorAll('.lang-tile').forEach(function(t){ t.classList.remove('sel'); });
  tile.classList.add('sel');
  alert('Language set to ' + name);
}


// Notifications on/off switch

function toggleNotif(btn) {
  var on = btn.getAttribute('aria-checked') === 'true';
  btn.setAttribute('aria-checked', String(!on));
}


// Tree data for album — read from storage
var albumData = [];

window.render = {
  init: function () {
    var data = storage.get('treeCards') || [];
    window.__TREE_DATA = data;
    albumData = Array.isArray(data) ? data : (data.albumData || []);
    applyFilters();
    renderAdminDash();
    if (document.getElementById('admin-pincode')) { adminUpdatePincodeOptions(); adminUpdatePlaceOptions(); }
    if (document.getElementById('admin-grid')) adminApplyFilters();
  }
};

// Close dropdown on outside click
document.addEventListener('click', function(e) {
  var ld = document.getElementById('logout-drop');
  if (ld && !e.target.closest('.avatar')) {
    ld.classList.remove('open');
  }
  var lsd = document.getElementById('logout-drop-surveyor');
  if (lsd && !e.target.closest('.avatar')) {
    lsd.classList.remove('open');
  }
  var sld = document.getElementById('slogout-drop');
  if (sld && !e.target.closest('.savatar')) {
    sld.classList.remove('open');
  }
  var cld = document.getElementById('clogout-drop');
  if (cld && !e.target.closest('.savatar')) {
    cld.classList.remove('open');
  }
  var ald = document.getElementById('alogout-drop');
  if (ald && !e.target.closest('.avatar')) {
    ald.classList.remove('open');
  }
});










function toggleALogoutDrop() {
  document.getElementById('alogout-drop').classList.toggle('open');
}


// Navigation

function goTo(page) {
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  document.getElementById('page-'+page).classList.add('active');
  var sb = document.getElementById('sbar');
  sb.className = 'status-bar';
  if (['admin-login','admin-login','ranger-login','ranger-dash','surveyor-login','surveyor-dash','trees','admin-login','admin-dash','admin-trees','admin-edit-tree','admin-add-tree','admin-trackers','admin-sponsors','admin-trackers-prospective','admin-sponsors-prospective','ranger-enroll','sponsor-enroll','surveyor-enroll','role-login'].indexOf(page) > -1) sb.classList.add('dark');
  else if (['sponsor-login','sponsor-dash','care-giver-login','care-giver-dash'].indexOf(page) > -1) sb.classList.add('blue');
  var alogout = document.getElementById('alogout-drop');
  if (alogout) alogout.classList.remove('open');

  if (page === 'admin-trees') {
    if (document.getElementById('admin-pincode')) { adminUpdatePincodeOptions(); adminUpdatePlaceOptions(); }
    if (document.getElementById('admin-grid')) adminApplyFilters();
  }
}

function switchAdminPanel(panel_id) {
  var is_activity = panel_id === 'activity';
  var activity_panel = document.getElementById('panel-admin-activity');
  var role_panel = document.getElementById('panel-admin-role');
  var activity_btn = document.getElementById('admin-btn-activity');
  var role_btn = document.getElementById('admin-btn-role');
  if (activity_panel) activity_panel.classList.toggle('is-hidden', !is_activity);
  if (role_panel) role_panel.classList.toggle('is-hidden', is_activity);
  if (activity_btn) activity_btn.classList.toggle('active', is_activity);
  if (role_btn) role_btn.classList.toggle('active', !is_activity);
}

function openAdminRole(role_id) {
  console.log('[admin] open role ->', role_id);
}

function openAdminActivity(activity_id) {
  console.log('[admin] open activity ->', activity_id);
}



// Password toggle

function togglePw(id, btn) {
  var inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.querySelector('i').className = inp.type === 'password' ? 'ti ti-eye' : 'ti ti-eye-off';
}


// Search tree - searches scientific, english and local names

function searchById() {
  applyFilters();
}



function searchTree() {
  searchById();
}


// Open profile — external redirect to individual-tree-profile.html

function openProfile(treeId) {
  var id = treeId || '625501-06-0001';
  var active = document.querySelector('.page.active');
  var current_hub = active ? active.id.replace('page-','') : 'admin-dash';
  var parent = encodeURIComponent('admin.html?hub=' + current_hub);
  try { sessionStorage.setItem('gobackFromTreeProfile', decodeURIComponent(parent)); } catch (e) {}
  var userid = '';
  try {
    var login = storage.get('login') || window._login || {};
    var role = (login['tree-login'] && login['tree-login']['admin']) || {};
    userid = role.userId || new URLSearchParams(location.search).get('userid') || '';
  } catch (e) {}
  var userid_param = userid ? '&userid=' + encodeURIComponent(userid) : '';
  var flang = (typeof filterLang !== 'undefined' ? filterLang : (typeof appLang !== 'undefined' ? appLang : 'en'));
  window.location.href = 'individual-tree-profile.html?treeId=' + encodeURIComponent(id) + '&parent=' + parent + '&flang=' + encodeURIComponent(flang) + userid_param;
}


// Open the map pinned to the tree currently shown in the profile

// Album

// Helper: location read from address ("School, pincode, Tamil Nadu" -> "School")

function treeLoc(t) { return t.address ? t.address.split(', ')[0] : ''; }


// Album render - additive filters: place (address) + tree name (scientific/english/local)

function renderAlbum(place, tree) {
  var grid = document.getElementById('album-grid');
  if (!grid) return;
  grid.innerHTML = '';
  
  var q = function(s){ return s ? String(s).toLowerCase() : ''; };
  place = q(place);
  tree = q(tree);
  
  var filtered = albumData.filter(function(t) {
    var matchPlace = true;
    var matchTree = true;
    if (place) matchPlace = q(t.address).indexOf(place) > -1 || q(t.addressLocalLang || '').indexOf(place) > -1 || q(t.pincode || '').indexOf(place) > -1 || q(Array.isArray(t.projectName) ? t.projectName.join(', ') : (t.projectName || '')).indexOf(place) > -1;
    if (tree) {
      matchTree = q(t.scientificName).indexOf(tree) > -1 ||
                  q(t.englishName).indexOf(tree) > -1 ||
                  q(t.localName).indexOf(tree) > -1;
    }
    return matchPlace && matchTree;
  });
  
  var countEl = document.getElementById('album-count');
  if (countEl) countEl.textContent = filtered.length + ' trees';

  var summaryEl = document.getElementById('album-summary');
  window._mapTrees = filtered;
  if (summaryEl) {
    if (filtered.length > 0) {
      var groups = {};
      filtered.forEach(function(t) {
        groups[t.englishName] = (groups[t.englishName] || 0) + 1;
      });
      var chips = Object.keys(groups).map(function(k) {
        return '<span class="album-chip chip-click" onclick="filterByTree(\'' + k + '\')">' + k + ' <b>– ' + groups[k] + '</b></span>';
      }).join('');
      summaryEl.innerHTML = chips;
      summaryEl.style.display = window._summaryOpen === false ? 'none' : 'flex';
    } else {
      summaryEl.style.display = 'none';
      summaryEl.innerHTML = '';
    }
    var toggle = document.getElementById('summary-toggle');
    if (toggle) toggle.classList.toggle('off', window._summaryOpen === false);
  }
  
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="no-trees">No trees found</div>';
    return;
  }
  
  filtered.forEach(function(t) {
    var card = document.createElement('div');
    card.className = 'tree-card';
    card.onclick = function() {
      openProfile(t.treeId);
    };
    
    var photo = document.createElement('div');
    photo.className = 'tree-photo';
    photo.style.background = t.bg;
    photo.innerHTML = '<div class="tree-emoji">' + t.emoji + '</div><div class="tree-location">' + treeLoc(t) + '</div>';
    
    var info = document.createElement('div');
    info.className = 'tree-info';
    info.innerHTML = 
      '<div class="tree-id">' + t.treeId + '</div>' +
      '<div class="tree-name">' + t.englishName + '</div>' +
      '<div class="tree-stats">' +
        '<span>📏 ' + formatLength(t.height,'height') + '</span>' +
        '<span>📐 ' + formatLength(t.diameter,'diameter') + '</span>' +
        '<span>📋 ' + t.logs + '</span>' +
      '</div>' +
      '<div class="tree-meta">' +
        (function(){ var c = t.cards && t.cards[t.cards.length - 1] || {}; return '' +
        '<div>👀 Encounter <b>' + (c.encounter != null ? c.encounter : 0) + '</b> · 📋 Logs <b>' + t.logs + '</b></div>' +
        '<div>Registered by <b>' + (c.registeredBy || '—') + '</b> · ' + (c.registrationDate || '—') + '</div>' +
        '<div>ID <b>' + (c.updaterId || c.registererId || '—') + '</b> · Updated by <b>' + (c.updatedBy || '—') + '</b> · ' + (c.updatedDate || '—') + '</div>'; })() +
      '</div>';
    
    card.appendChild(photo);
    card.appendChild(info);
    grid.appendChild(card);
  });
}



function applyFilters() {
  var place_el = document.getElementById('album-place');
  var tree_el = document.getElementById('album-tree');
  if (!place_el || !tree_el) { return; }
  renderAlbum(place_el.value.trim(), tree_el.value.trim());
}


// Toggle summary panel visibility (sticky via re-render)

function toggleSummary() {
  window._summaryOpen = window._summaryOpen === false ? true : false;
  var toggle = document.getElementById('summary-toggle');
  if (toggle) toggle.classList.toggle('off', window._summaryOpen === false);
  applyFilters();
}


// Clicking a summary chip fills the tree-name box and re-applies (additive)

function filterByTree(name) {
  var el = document.getElementById('album-tree');
  el.value = name;
  var btn = el.parentNode.querySelector('.clear-btn');
  if (btn) btn.disabled = false;
  applyFilters();
}


// Dirty-state: X clear button disabled (greyed) when the filter has no value

function onInput(el) {
  var btn = el.parentNode.querySelector('.clear-btn');
  if (btn) btn.disabled = !el.value;
  applyFilters();
}


// Clear a filter's value

function clearInput(id) {
  var el = document.getElementById(id);
  el.value = '';
  var btn = el.parentNode.querySelector('.clear-btn');
  if (btn) btn.disabled = true;
  applyFilters();
}


// Admin page

function adminSearchById() {
  document.getElementById('admin-pincode').value = '';
  if (document.getElementById('admin-pincode')) { adminUpdatePincodeOptions(); adminUpdatePlaceOptions(); }
  var id = document.getElementById('admin-id').value.trim();
  adminRenderAlbum('', '', id);
}



function adminUpdatePincodeOptions() {
  var pincodeSelect = document.getElementById('admin-pincode');
  var currentVal = pincodeSelect.value;
  var pins = [];
  albumData.forEach(function(t) {
    if (t.pincode && pins.indexOf(t.pincode) === -1) pins.push(t.pincode);
  });
  pins.sort();
  pincodeSelect.innerHTML = '<option value="">All pincodes</option>';
  pins.forEach(function(p) {
    var opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    if (p === currentVal) opt.selected = true;
    pincodeSelect.appendChild(opt);
  });
}

function adminUpdatePlaceOptions() {
  var pincode = document.getElementById('admin-pincode').value;
  var placeSelect = document.getElementById('admin-place');
  var currentVal = placeSelect.value;
  var places = [];
  if (pincode) {
    albumData.forEach(function(t) {
      if (t.pincode === pincode && places.indexOf(treeLoc(t)) === -1) places.push(treeLoc(t));
    });
  } else {
    albumData.forEach(function(t) {
      if (places.indexOf(treeLoc(t)) === -1) places.push(treeLoc(t));
    });
  }
  placeSelect.innerHTML = '<option value="">All places</option>';
  places.forEach(function(p) {
    var opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    if (p === currentVal) opt.selected = true;
    placeSelect.appendChild(opt);
  });
}



function adminApplyFilters() {
  var pincode = document.getElementById('admin-pincode').value;
  var place = document.getElementById('admin-place').value;
  var searchId = document.getElementById('admin-id').value.trim();
  adminRenderAlbum(pincode, place, searchId);
}



function adminRenderAlbum(pincode, place, searchId) {
  var grid = document.getElementById('admin-grid');
  if (!grid) return;
  grid.innerHTML = '';
  var filtered = albumData.filter(function(t) {
    var matchPincode = true, matchPlace = true, matchSearch = true;
    if (pincode && pincode !== '') matchPincode = t.pincode === pincode;
    if (place && place !== '') matchPlace = treeLoc(t) === place;
    if (searchId && searchId !== '') matchSearch = t.id.indexOf(searchId) > -1;
    return matchPincode && matchPlace && matchSearch;
  });
  var countEl = document.getElementById('admin-count');
  if (countEl) countEl.textContent = filtered.length + ' trees';
  var countHead = document.getElementById('admin-count-header');
  if (countHead) countHead.textContent = filtered.length;
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="no-trees">No trees found</div>';
    return;
  }
  filtered.forEach(function(t) {
    var card = document.createElement('div');
    card.className = 'tree-card';
    card.onclick = function() {
      openProfile(t.id);
    };
    var photo = document.createElement('div');
    photo.className = 'tree-photo';
    photo.style.background = t.bg;
    photo.innerHTML = '<div class="tree-emoji">' + t.emoji + '</div><div class="tree-location"><button class="gis-pin" type="button" onclick="event.stopPropagation();showInMap([\'' + t.id + '\'])"><i class="ti ti-map-pin"></i></button><span>' + treeLoc(t) + '</span></div>';
    var info = document.createElement('div');
    info.className = 'tree-info';
    info.innerHTML =
      '<div class="tree-id">' + t.id + '</div>' +
      '<div class="tree-name">' + t.name + '</div>' +
      '<div class="tree-stats">' +
        '<span>📍 ' + t.pincode + '</span>' +
        '<span>📏 ' + formatLength(t.height,'height') + '</span>' +
        '<span>📐 ' + formatLength(t.diameter,'diameter') + '</span>' +
      '</div>';
    card.appendChild(photo);
    card.appendChild(info);
    grid.appendChild(card);
  });
}


// Initial render
applyFilters();
if (document.getElementById('admin-pincode')) { adminUpdatePincodeOptions(); adminUpdatePlaceOptions(); }
if (document.getElementById('admin-grid')) adminApplyFilters();

var hubMode = new URLSearchParams(location.search).get('hub');
if (hubMode === 'login') { goTo('admin-login'); }
else { window.location.href = 'login-hub.html'; }

