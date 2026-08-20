// tree-pool.js — reusable Tree Pool module (loaded by tree-pool.html?from=<page>)

// Tree data for album — populated from tree_cards.json via loadTreeData
var albumData = [];

// Reusable module params — ?parent=<back url>&exclude=<comma-separated tree ids>
var treePoolParentUrl = new URLSearchParams(location.search).get('parent') || '';
var treePoolExcludeIds = (new URLSearchParams(location.search).get('exclude') || '').split(',').filter(Boolean);

function treePoolBack() {
  if (treePoolParentUrl) { window.location.href = treePoolParentUrl; return; }
  if (window.history.length > 1) { window.history.back(); return; }
  window.location.href = 'filter.html';
}

// Places for search — loaded from places_name.json: [{placeId, placeName:{en,ta}, pinCode, variety}, ...]
var __SUGGESTIONS = [];
function populatePlaceList() {
  __PLACES = __PLACES || [];
  __SUGGESTIONS = [];
  __PLACES.forEach(function (p) {
    __SUGGESTIONS.push({ value: p.placeName.en, label: p.placeName.en + ' · ' + p.pinCode });
    if (p.placeName.ta) __SUGGESTIONS.push({ value: p.placeName.ta, label: p.placeName.ta + ' · ' + p.pinCode });
  });
  var projects = [];
  (window.__TREE_DATA || []).forEach(function (t) {
    if (t.project && projects.indexOf(t.project) === -1) projects.push(t.project);
    var al = t.addressLocalLang;
    if (al && __SUGGESTIONS.filter(function (s) { return s.value === al; }).length === 0) __SUGGESTIONS.push({ value: al, label: al });
  });
  projects.forEach(function (pr) {
    __SUGGESTIONS.push({ value: pr, label: pr });
  });
}
function renderSuggestions(query) {
  var box = document.getElementById('album-suggest');
  if (!box) return;
  var q = String(query || '').toLowerCase().trim();
  if (!q) { box.classList.remove('open'); return; }
  var list = __SUGGESTIONS.filter(function (s) {
    return s.value.toLowerCase().indexOf(q) > -1 || s.label.toLowerCase().indexOf(q) > -1;
  });
  if (list.length === 0) { box.classList.remove('open'); return; }
  box.innerHTML = '';
  list.slice(0, 8).forEach(function (s) {
    var item = document.createElement('div');
    item.className = 'album-suggest-item';
    item.textContent = s.label;
    item.onclick = function () { chooseSuggestion(s); };
    box.appendChild(item);
  });
  box.classList.add('open');
}
function chooseSuggestion(s) {
  var el = document.getElementById('album-place');
  el.value = s.value;
  var btn = el.parentNode.querySelector('.clear-btn');
  if (btn) btn.disabled = false;
  document.getElementById('album-suggest').classList.remove('open');
  applyFilters();
}
document.addEventListener('click', function (e) {
  var box = document.getElementById('album-suggest');
  var wrap = document.querySelector('.clear-wrap');
  if (box && wrap && !wrap.contains(e.target)) box.classList.remove('open');
});
function resolvePlace(query) {
  var q = String(query).toLowerCase().trim();
  if (!q) return null;
  for (var i = 0; i < __PLACES.length; i++) {
    var p = __PLACES[i];
    if (String(p.placeName.en).toLowerCase() === q || String(p.placeName.ta).toLowerCase() === q || String(p.pinCode) === q || String(p.placeId).toLowerCase() === q) { return p; }
  }
  return null;
}
// Open profile — navigate to the standalone tree profile page
function openProfile(treeId) {
  var id = treeId || '625501-06-0001';
  window.location.href = 'tree-profile.html?treeId=' + encodeURIComponent(id);
}

// Open the map pinned to a tree by its ID (from a card)
function openTreeMapById(id) {
  var tree = null;
  for (var i = 0; i < albumData.length; i++) {
    if (albumData[i].treeId === id) { tree = albumData[i]; break; }
  }
  if (hasTreeGis(tree)) {
    showTreeDetailsInMap(tree);
  } else {
    alert('Location not available for this tree.');
  }
}

// Opening the map as a fullscreen in-app modal
function showMap(coordsParam) {
  document.getElementById('map-frame').src = 'map.html?coords=' + encodeURIComponent(coordsParam);
  document.getElementById('map-modal').classList.add('open');
}

function closeMapModal() {
  document.getElementById('map-modal').classList.remove('open');
  document.getElementById('map-frame').src = '';
}

// Helper: location read from address ("School, pincode, Tamil Nadu" -> "School")
function treeLoc(t) { return t.address ? t.address.split(', ')[0] : ''; }

function graphemes(s) {
  if (Intl && Intl.Segmenter) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(String(s || '')), function (seg) { return seg.segment; });
  }
  var combining = /[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f\u0bbe-\u0bcc\u0bcd\u0c3e-\u0c4c\u0cbe-\u0ccc\u0d3e-\u0d4c\u0dca]/;
  var chars = Array.from(String(s || ''));
  var out = [];
  chars.forEach(function (ch) {
    if (out.length && combining.test(ch)) { out[out.length - 1] += ch; }
    else { out.push(ch); }
  });
  return out;
}
function graphemeStartsWith(value, prefix) {
  var v = graphemes(value);
  var p = graphemes(prefix);
  if (p.length === 0) return true;
  if (p.length > v.length) return false;
  for (var i = 0; i < p.length; i++) { if (v[i] !== p[i]) return false; }
  return true;
}

// Album render - additive filters: place (address) + tree name (scientific/english/local)
function renderAlbum(place, tree) {
  var grid = document.getElementById('album-grid');
  if (!grid) return;
  grid.innerHTML = '';

  var q = function(s){ return s ? String(s).toLowerCase() : ''; };
  place = q(place);
  tree = q(tree);

var isLocalScript = function(s){ return /[\u0900-\u0DFF]/.test(s || ''); };
    if (place || tree) {
      setFilterLang(storage.detectLanguage(place || tree || ''));
    }
    var lang = filterLang;
    var useLocal = lang !== 'en';
    window._mapLang = lang;
    var normalizeId = function(s){ return String(s || '').toLowerCase().replace(/-/g, ''); };
    var filtered = albumData.filter(function(t) {
      var matchPlace = true;
      var matchTree = true;
      if (place) {
        if (useLocal) {
          matchPlace = q(t.addressLocalLang || '').indexOf(place) > -1;
        } else {
          var matchTreeId = q(t.treeId).indexOf(place) > -1 || normalizeId(t.treeId).indexOf(normalizeId(place)) > -1;
          matchPlace = q(t.address).indexOf(place) > -1 || q(t.pincode || '').indexOf(place) > -1 || q(t.project || '').indexOf(place) > -1 || matchTreeId;
        }
      }
    if (tree) {
      matchTree = graphemeStartsWith(q(t.scientificName), tree) ||
                  graphemeStartsWith(q(t.englishName), tree) ||
                  graphemeStartsWith(q(t.localName), tree);
    }
    return matchPlace && matchTree;
  });

  var countEl = document.getElementById('album-count');
  if (countEl) {
    var varieties = {};
    filtered.forEach(function(t) { varieties[t.englishName] = 1; });
    var vCount = Object.keys(varieties).length;
    countEl.textContent = vCount + ' varieties · ' + filtered.length + ' trees';
  }

  var summaryEl = document.getElementById('album-summary');
  window._mapTrees = filtered;
  if (summaryEl) {
    if (filtered.length > 0) {
      var groups = {};
      filtered.forEach(function(t) {
        var name = storage.treeNameIn(t, lang);
        groups[name] = (groups[name] || 0) + 1;
      });
      var chips = Object.keys(groups).map(function(k) {
        return '<span class="album-chip chip-click" onclick="filterByTree(\'' + k + '\')">' + k + ' <b>– ' + groups[k] + '</b></span>';
      }).join('');
      summaryEl.innerHTML = chips;
      var mapBtn = document.createElement('button');
      mapBtn.type = 'button';
      mapBtn.className = 'map-btn';
      mapBtn.innerHTML = '<i class="ti ti-map-2"></i> Show in map';
      mapBtn.onclick = openMap;
      summaryEl.appendChild(mapBtn);
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
    card.className = 'tree-snapshot';
    card.onclick = function() {
      openProfile(t.treeId);
    };

    var photo = document.createElement('div');
    photo.className = 'tree-photo';
    photo.style.background = t.bg;
    photo.innerHTML = '<button class="card-pin-btn" type="button" title="Show in map" onclick="event.stopPropagation();openTreeMapById(\'' + t.treeId + '\')"><i class="ti ti-map-pin" style="font-size:0.8rem"></i></button><div class="tree-emoji">' + t.emoji + '</div>' + (t.health ? '<div class="tree-health health-' + String(t.health).toLowerCase().replace(/\s+/g, '-') + '">' + t.health + '</div>' : '');

    var lastCard = t.cards && t.cards[t.cards.length - 1] || {};
    var isFirst = String(lastCard.encounter) === '1';
    var upd = isFirst ? lastCard.registeredBy : lastCard.updatedBy;
    var updDate = isFirst ? lastCard.registrationDate : lastCard.updatedDate;

    var info = document.createElement('div');
    info.className = 'tree-info';
    info.innerHTML =
      '<div class="tree-name">' + storage.treeNameIn(t, lang) + '</div>' +
      '<div class="tree-id">' + t.treeId + '</div>' +
      '<div class="tree-addr"><i class="ti ti-map-pin" style="font-size:0.7rem"></i> ' + ((lang === 'ta') ? (t.addressLocalLang || t.address || '—') : (t.address || '—')) + '</div>';

    card.appendChild(info);
    info.appendChild(photo);

    var stats = document.createElement('div');
    stats.className = 'tree-stats';
    stats.innerHTML = '<span>📏 ' + t.height + '</span><span>📐 ' + t.diameter + '</span>';
    info.appendChild(stats);

    var meta = document.createElement('div');
    meta.className = 'tree-meta';
    var updLabel = isFirst ? 'Registered by' : 'Updated by';
    meta.innerHTML = '<div>👀 Encounter <b>' + (lastCard.encounter != null ? lastCard.encounter : 0) + '</b> · ' + (updDate || '—') + '</div><div>' + updLabel + ' <b>' + (upd || '—') + '</b></div>';
    info.appendChild(meta);

    grid.appendChild(card);
  });
}

function applyFilters() {
  var place = document.getElementById('album-place').value.trim();
  var tree = document.getElementById('album-tree').value.trim();
  renderAlbum(place, tree);
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
  if (el.id === 'album-place') renderSuggestions(el.value);
  applyFilters();
}

// Clear a filter's value
function clearInput(id) {
  var el = document.getElementById(id);
  el.value = '';
  var btn = el.parentNode.querySelector('.clear-btn');
  if (btn) btn.disabled = true;
  if (id === 'album-place') document.getElementById('album-suggest').classList.remove('open');
  applyFilters();
}

// Spread the current result set over Google Maps (one pin per tree)
function openMap() {
  var trees = window._mapTrees || albumData;
  var coords = trees.filter(function(t){
    return hasTreeGis(t);
  }).map(function(t){
    return treeMapCoords(t);
  });
  if (coords.length > 0) {
    showMap(coords.join('|'));
  } else {
    alert('No tree locations found to show on the map.');
  }
}

function normalizeAlbum(t) {
  var out = {};
  for (var k in t) { if (Object.prototype.hasOwnProperty.call(t, k)) { out[k] = t[k]; } }
  var enc = t['encounters-list'] || {};
  var keys = Object.keys(enc);
  var last = enc[keys[keys.length - 1]] || {};
  var st = last['health-status'] || {};
  var c = t.card || {};
  out.id = t.treeId;
  out.name = t.englishName || t.name || c.addr || '';
  out.emoji = t.emoji || c.emoji || '🌳';
  out.bg = t.bg || c.bg || '';
  out.address = t.address || c.addrFull || c.addr || '';
  out.englishName = t.englishName || t.name || '';
  out.localName = t.localName || '';
  out.scientificName = t.scientificName || '';
  out.pincode = t.pincode || '';
  out.height = st.height || c.height || '—';
  out.diameter = st.diameter || c.diameter || '—';
  out.health = st.health || '';
  out.logs = t.encounters || keys.length || c.logs || 0;
  out.cards = keys.map(function (key) {
    var e = enc[key];
    return { encounter: key, registeredBy: e.registeredBy || '—', registrationDate: e.registeredDate || '—', registererId: e.registererId || '—', updatedBy: e.updatedBy || e.registeredBy || '—', updatedDate: e.updatedDate || e.registeredDate || '—', updaterId: e.updaterId || e.registererId || '—' };
  });
  return out;
}

window.render = {
  init: function () {
    __PLACES = storage.get('places') || [];
    window.__TREE_DATA = storage.get('treeCards') || [];
    window.TREE_NAMES_DB = storage.get('treeNames') || [];
    window.TREE_COLOURS = storage.get('treeColours') || [];
    window._login = storage.get('login') || {};
    filterLang = appLang;
    albumData = (window.__TREE_DATA || []).filter(function (t) {
      var e1 = (t['encounters-list'] || {})['1'] || {};
      return (e1.acceptance || {}).status === 'accepted';
    }).map(normalizeAlbum);
    if (treePoolExcludeIds.length > 0) {
      albumData = albumData.filter(function (t) { return treePoolExcludeIds.indexOf(t.treeId) === -1; });
    }
    populatePlaceList();
    applyFilters();
  }
};