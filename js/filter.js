// filter.js — standalone Search/Album flow (loaded by filter.html)

// Tree data for album — populated from tree_cards.json via loadTreeData
var albumData = [];
var filterParentUrl = new URLSearchParams(location.search).get('parent') || '';
function filterBack() {
  if (filterParentUrl) { window.location.href = filterParentUrl; return; }
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
  var qp_cur = new URLSearchParams(location.search);
  qp_cur.set('place', place);
  qp_cur.set('tree', tree);
  var parentUrl = encodeURIComponent('filter.html?' + qp_cur.toString());
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
    showInMap([id]);
  } else {
    alert('Location not available for this tree.');
  }
}

function closeMapModal() {
  document.getElementById('map-modal').classList.remove('open');
  document.getElementById('map-frame').src = '';
}

function yearsSince(dateStr) {
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return ((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1);
}
function ageLabel(dateStr) {
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  var years = ((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1);
  var dd = String(d.getDate()).padStart(2, '0');
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var yyyy = d.getFullYear();
  return 'Age:' + years + 'y(' + dd + '-' + mm + '-' + yyyy + ')';
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

var _segmenter = null;
function graphemes(s) {
  if (Intl && Intl.Segmenter) {
    if (!_segmenter) { _segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' }); }
    return Array.from(_segmenter.segment(String(s || '')), function (seg) { return seg.segment; });
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

function normalizeQuery(s) {
  return String(s || '').toLowerCase().trim().replace(/\s+/g, ' ').replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, '').trim();
}

function searchInTreePlace(place_query) {
  var query = normalizeQuery(place_query);
  if (!query) { return albumData.slice(); }
  var normalized_query = query.replace(/-/g, '');
  var hit = {};
  var pool = window.__SEARCH_POOL || [];
  pool.forEach(function(p) {
    var tree_id = normalizeQuery(p.treeId);
    var addr = normalizeQuery(cardAddressText(p, filterLang));
    var pin = normalizeQuery(p.pincode);
    var proj = normalizeQuery(p.project);
    if (addr.indexOf(query) > -1 ||
        pin.indexOf(query) > -1 ||
        proj.indexOf(query) > -1 ||
        tree_id.indexOf(query) > -1 ||
        tree_id.replace(/-/g, '').indexOf(normalized_query) > -1) {
      hit[p.treeId] = 1;
    }
  });
  return albumData.filter(function(t) { return hit[t.treeId]; });
}

function searchInTreeName(tree_query) {
  var query = normalizeQuery(tree_query);
  if (!query) { return albumData.slice(); }
  var q_parts = query.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s; });
  if (q_parts.length === 0) q_parts = [query];
  var hit = {};
  var pool = window.__SEARCH_POOL || [];
  pool.forEach(function(p) {
    var names = p.speciesName || {};
    var matched = Object.keys(names).some(function(key) {
      var raw = String(names[key] || '');
      if (!raw) return false;
      var parts = raw.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s; });
      if (parts.length === 0) return q_parts.some(function(qp) { return graphemeStartsWith(normalizeQuery(raw), qp); });
      return q_parts.some(function(qp) {
        return parts.some(function(part) {
          return graphemeStartsWith(normalizeQuery(part), qp);
        });
      });
    });
    if (matched) hit[p.treeId] = 1;
  });
  return albumData.filter(function(t) { return hit[t.treeId]; });
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
        if (!groups[name]) groups[name] = { count: 0, isFallback: true };
        groups[name].count++;
        var has_native = t.speciesName && t.speciesName[lang] && String(t.speciesName[lang]).trim() !== '';
        if (has_native) groups[name].isFallback = false;
      });
      var native_keys = [];
      var fallback_keys = [];
      Object.keys(groups).forEach(function(k) {
        if (groups[k].isFallback) fallback_keys.push(k);
        else native_keys.push(k);
      });
      native_keys.sort(function(a, b) {
        try { return a.localeCompare(b, lang, { sensitivity: 'base' }); } catch (e) { return a.localeCompare(b); }
      });
      fallback_keys.sort(function(a, b) {
        try { return a.localeCompare(b, 'en', { sensitivity: 'base' }); } catch (e) { return a.localeCompare(b); }
      });
      var sorted_keys = native_keys.concat(fallback_keys);
      var chips = sorted_keys.map(function(k) {
        return '<span class="album-chip chip-click" data-tree-name="' + k.replace(/"/g, '&quot;') + '">' + k + ' <b>– ' + groups[k].count + '</b></span>';
      }).join('');
      summaryEl.innerHTML = chips;
      summaryEl.querySelectorAll('.chip-click').forEach(function (chip) {
        chip.onclick = function () { filterByTree(this.getAttribute('data-tree-name')); };
      });
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

  var native_trees = [];
  var fallback_trees = [];
  filtered.forEach(function(t) {
    var has_native = t.speciesName && t.speciesName[lang] && String(t.speciesName[lang]).trim() !== '';
    if (has_native) native_trees.push(t);
    else fallback_trees.push(t);
  });
  function sortTreeBucket(arr, locale_code) {
    arr.sort(function(a, b) {
      var name_a = treeNameFromCard(a, lang) || '';
      var name_b = treeNameFromCard(b, lang) || '';
      var cmp = 0;
      try { cmp = name_a.localeCompare(name_b, locale_code, { sensitivity: 'base' }); } catch (e) { cmp = name_a.localeCompare(name_b); }
      if (cmp !== 0) return cmp;
      var id_a = String(a.treeId || '');
      var id_b = String(b.treeId || '');
      if (id_a < id_b) return -1;
      if (id_a > id_b) return 1;
      return 0;
    });
  }
  sortTreeBucket(native_trees, lang);
  sortTreeBucket(fallback_trees, 'en');
  filtered = native_trees.concat(fallback_trees);

  var frag = document.createDocumentFragment();
  filtered.forEach(function(t) {
    var card = document.createElement('div');
    card.className = 'tree-snapshot';
    card.onclick = (function (id) { return function () { openProfile(id); }; })(t.treeId);

    var photo = document.createElement('div');
    photo.className = 'tree-photo';
    photo.style.background = t.bg;
    photo.innerHTML = '<button class="card-pin-btn" type="button" title="Show in map" onclick="event.stopPropagation();openTreeMapById(\'' + t.treeId + '\')"><i class="ti ti-map-pin" style="font-size:0.8rem"></i></button><div class="tree-emoji">' + t.emoji + '</div>' + (t.health ? '<div class="tree-health health-' + String(t.health).toLowerCase().replace(/\s+/g, '-') + '">' + t.health + '</div>' : '') + (t['date-of-planting'] ? '<div class="tree-planted" style="color:white">' + ageLabel(t['date-of-planting']) + '</div>' : '');

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

    frag.appendChild(card);
  });
  grid.appendChild(frag);
}

var search_timer = null;
function setSearching(is_on) {
  var el = document.getElementById('search-overlay');
  if (el) el.classList.toggle('open', !!is_on);
}

function applyFilters() {
  if (search_timer) clearTimeout(search_timer);
  setSearching(true);
  var place_el = document.getElementById('album-place');
  var tree_el = document.getElementById('album-tree');
  var place_val = place_el ? place_el.value : '';
  var tree_val = tree_el ? tree_el.value : '';
  search_timer = setTimeout(function() {
    search_timer = null;
    renderAlbum(normalizeQuery(place_val), normalizeQuery(tree_val));
    setSearching(false);
  }, 80);
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
  if (el.isComposing) return;
  var raw = String(el.value || '');
  var stripped = raw.replace(/[\u00A0\u200B\u200C\u200D\uFEFF]+$/g, '').replace(/\s+$/g, '');
  if (stripped !== raw) {
    var pos = el.selectionStart;
    el.value = stripped;
    try { el.setSelectionRange(pos - (raw.length - stripped.length), pos - (raw.length - stripped.length)); } catch (e) {}
  }
  var btn = el.parentNode.querySelector('.clear-btn');
  if (btn) btn.disabled = !String(el.value).trim();
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
  showInMap(ids);
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
    (function() {
      var qp_hero = new URLSearchParams(location.search);
      var role = (qp_hero.get('role') || '').trim();
      var hero = document.getElementById('main-hero');
      var back_btn = document.getElementById('filter-back');
      if (hero) {
        if (role) {
          hero.style.display = 'none';
          hero.setAttribute('data-role', role.toLowerCase());
        } else {
          hero.style.display = '';
          hero.removeAttribute('data-role');
        }
      }
      if (back_btn) {
        filterParentUrl = qp_hero.get('parent') || filterParentUrl;
        if (filterParentUrl) back_btn.style.display = 'flex';
        else back_btn.style.display = 'none';
      }
    })();
    albumData = (window.__TREE_DATA || []).filter(function (t) {
      var e1 = (t['encounters-list'] || {})['1'] || {};
      return (e1.acceptance || {}).status === 'accepted';
    }).map(normalizeAlbum);
    (function() {
      var raw = new URLSearchParams(location.search).get('exclude');
      if (!raw) return;
      var list = [];
      try { var j = JSON.parse(raw); if (Array.isArray(j)) list = j; else list = [j]; } catch (e) { var s = String(raw).trim().replace(/^\[/, '').replace(/\]$/, ''); list = s.split(',').map(function(x) { return String(x).trim().replace(/^\"|\"$/g, '').replace(/^'|'$/g, ''); }).filter(Boolean); }
      if (!list.length) return;
      var ex = {}; list.forEach(function(id) { ex[String(id).trim()] = 1; });
      albumData = albumData.filter(function(t) { return !ex[t.treeId]; });
    })();
    window.__SEARCH_POOL = albumData.map(function(t) {
      return { treeId: t.treeId, pincode: t.pincode, project: t.project, speciesName: t.speciesName, address: t.address };
    });
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