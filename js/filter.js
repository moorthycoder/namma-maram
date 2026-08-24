// filter.js — standalone Search/Album flow (loaded by filter.html)

// Tree data for album — populated from tree_cards.json via loadTreeData
var albumData = [];

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
    Object.keys(t.address || {}).forEach(function (addr_key) {
      var al = t.address[addr_key];
      if (al && __SUGGESTIONS.filter(function (s) { return s.value === al; }).length === 0) __SUGGESTIONS.push({ value: al, label: al });
    });
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
  var place = document.getElementById('album-place').value.trim();
  var tree = document.getElementById('album-tree').value.trim();
  var parentUrl = encodeURIComponent('filter.html?place=' + encodeURIComponent(place) + '&tree=' + encodeURIComponent(tree));
  var flangParam = 'flang=' + encodeURIComponent(filterLang);
  window.location.href = 'tree-profile.html?treeId=' + encodeURIComponent(id) + '&from=filter&parent=' + parentUrl + '&' + flangParam;
}

// Open the map pinned to a tree by its ID (from a card)
function openTreeMapById(id) {
  var tree = null;
  for (var i = 0; i < albumData.length; i++) {
    if (albumData[i].treeId === id) { tree = albumData[i]; break; }
  }
  if (hasTreeGis(tree)) {
    showMap(id);
  } else {
    alert('Location not available for this tree.');
  }
}

// Opening the map as a fullscreen in-app modal
function showMap(idsParam) {
  document.getElementById('map-frame').src = 'map.html?ids=' + encodeURIComponent(idsParam);
  document.getElementById('map-modal').classList.add('open');
}

function closeMapModal() {
  document.getElementById('map-modal').classList.remove('open');
  document.getElementById('map-frame').src = '';
}

// Helpers: language-keyed readers for nested name/address on a tree card
function cardNameText(card, lang_key) {
  var names = (card && card.speciesName) || {};
  return names[lang_key] || names.en || names.ta || '';
}

function cardAddressText(card, lang_key) {
  var addr = (card && card.address) || {};
  return addr[lang_key] || addr.en || addr.ta || '';
}

// Helper: location read from address ("School, pincode, Tamil Nadu" -> "School")
function treeLoc(t) { var addr = cardAddressText(t, 'en'); return addr ? addr.split(', ')[0] : ''; }

function treeNameFromCard(t, lang) {
  if (!t) { return ''; }
  return cardNameText(t, lang);
}

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

function searchInTreePlace(place_query) {
  var query = String(place_query || '').toLowerCase().trim();
  if (!query) { return albumData.slice(); }
  var normalized_query = query.replace(/-/g, '');
  return albumData.filter(function (t) {
    var tree_id = String(t.treeId || '').toLowerCase();
    return String(cardAddressText(t, filterLang)).toLowerCase().indexOf(query) > -1 ||
           String(t.pincode || '').toLowerCase().indexOf(query) > -1 ||
           String(t.project || '').toLowerCase().indexOf(query) > -1 ||
           tree_id.indexOf(query) > -1 ||
           tree_id.replace(/-/g, '').indexOf(normalized_query) > -1;
  });
}

function searchInTreeName(tree_query) {
  var query = String(tree_query || '').toLowerCase().trim();
  if (!query) { return albumData.slice(); }
  return albumData.filter(function (t) {
    var names = t.speciesName || {};
    var matched = false;
    Object.keys(names).some(function (key) {
      matched = graphemeStartsWith(String(names[key]).toLowerCase(), query);
      return matched;
    });
    return matched;
  });
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
    window._mapLang = lang;
    var filtered = searchInTreePlace(place).filter(function (t) {
      return searchInTreeName(tree).indexOf(t) > -1;
    });

  var countEl = document.getElementById('album-count');
  if (countEl) {
    var varieties = {};
    filtered.forEach(function(t) { varieties[cardNameText(t, 'en')] = 1; });
    var vCount = Object.keys(varieties).length;
    countEl.textContent = vCount + ' varieties · ' + filtered.length + ' trees';
  }

  var summaryEl = document.getElementById('album-summary');
  window._mapTrees = filtered;
  if (summaryEl) {
    if (filtered.length > 0) {
      var groups = {};
      filtered.forEach(function(t) {
        var name = treeNameFromCard(t, lang);
        groups[name] = (groups[name] || 0) + 1;
      });
      var chips = Object.keys(groups).sort().map(function(k) {
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
      '<div class="tree-name">' + treeNameFromCard(t, lang) + '</div>' +
      '<div class="tree-id">' + t.treeId + '</div>' +
      '<div class="tree-addr"><i class="ti ti-map-pin" style="font-size:0.7rem"></i> ' + (cardAddressText(t, lang) || '—') + '</div>';

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

// Spread the current result set over the map (one pin per tree, ids only)
function openMap() {
  var trees = window._mapTrees || albumData;
  var ids = trees.filter(function(t){
    return hasTreeGis(t);
  }).map(function(t){
    return t.treeId;
  });
  if (ids.length > 0) {
    showMap(ids.join('|'));
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
  out.name = cardNameText(t, 'en') || c.addr || '';
  out.emoji = t.emoji || c.emoji || '🌳';
  out.bg = t.bg || c.bg || '';
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
    storage.syncTreeCards();
    window.TREE_COLOURS = storage.get('treeColours') || [];
    window._login = storage.get('login') || {};
    filterLang = appLang;
    albumData = (window.__TREE_DATA || []).filter(function (t) {
      var e1 = (t['encounters-list'] || {})['1'] || {};
      return (e1.acceptance || {}).status === 'accepted';
    }).map(normalizeAlbum);
    var qp = new URLSearchParams(location.search);
    var placeEl = document.getElementById('album-place');
    var treeEl = document.getElementById('album-tree');
    if (qp.get('place') || qp.get('tree')) {
      placeEl.value = qp.get('place') || '';
      treeEl.value = qp.get('tree') || '';
      placeEl.parentNode.querySelector('.clear-btn').disabled = !placeEl.value;
      treeEl.parentNode.querySelector('.clear-btn').disabled = !treeEl.value;
      history.replaceState(null, '', 'filter.html');
    }
    populatePlaceList();
    applyFilters();
  }
};