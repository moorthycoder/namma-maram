// filter2.js — place-name search for the flattened card structure
// Card: { treeId, scientificName, projectName[], pincode, ... }
// Map (places_name.json): { placeId, placeName: {langs}, pinCode }

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

function searchByPlaceName(place_name, card_file, lookup_file) {
  var q = normalizeQuery(place_name);
  if (!q) { return card_file.map(function (c) { return c.treeId; }); }
  var lang_key = (typeof filterLang !== 'undefined' && filterLang) || 'en';
  var result = [];
  var seen = {};
  for (var i = 0; i < lookup_file.length; i++) {
    var names = lookup_file[i].placeName || {};
    var name_text = names[lang_key] || names.en || '';
    if (normalizeQuery(String(name_text)).indexOf(q) === -1) { continue; }
    var card_identity = names.en || '';
    for (var c = 0; c < card_file.length; c++) {
      if (card_file[c].placeName === card_identity && !seen[card_file[c].treeId]) {
        seen[card_file[c].treeId] = 1;
        result.push(card_file[c].treeId);
      }
    }
  }
  return result;
}

function searchByPinCode(pincode, card_file) {
  var q = normalizeQuery(pincode);
  if (!q) { return card_file.map(function (c) { return c.treeId; }); }
  var result = [];
  for (var i = 0; i < card_file.length; i++) {
    if (normalizeQuery(String(card_file[i].pincode || '')).indexOf(q) > -1) { result.push(card_file[i].treeId); }
  }
  return result;
}

function searchBySpeciesName(species_name, card_file, lookup_file) {
  var q = normalizeQuery(species_name);
  if (!q) { return card_file.map(function (c) { return c.treeId; }); }
  var lang_key = (typeof filterLang !== 'undefined' && filterLang) || 'en';
  var result = [];
  var seen = {};
  for (var i = 0; i < lookup_file.length; i++) {
    var sci = Object.keys(lookup_file[i])[0];
    var langs = lookup_file[i][sci] || {};
    var name_text = (langs[lang_key] || langs.en || [])[0] || '';
    if (normalizeQuery(String(name_text)).indexOf(q) === -1) { continue; }
    for (var c = 0; c < card_file.length; c++) {
      if (card_file[c].scientificName === sci && !seen[card_file[c].treeId]) {
        seen[card_file[c].treeId] = 1;
        result.push(card_file[c].treeId);
      }
    }
  }
  return result;
}

function searchByTreeId(tree_id_str, card_file) {
  var q = normalizeQuery(tree_id_str);
  if (!q) { return card_file.map(function (c) { return c.treeId; }); }
  var nq = q.replace(/-/g, '');
  var result = [];
  for (var i = 0; i < card_file.length; i++) {
    var id = normalizeQuery(String(card_file[i].treeId || ''));
    if (id.indexOf(q) > -1 || id.replace(/-/g, '').indexOf(nq) > -1) { result.push(card_file[i].treeId); }
  }
  return result;
}

function searchByProjectName(project_name, card_file, lookup_file) {
  var q = normalizeQuery(project_name);
  if (!q) { return card_file.map(function (c) { return c.treeId; }); }
  var lang_key = (typeof filterLang !== 'undefined' && filterLang) || 'en';
  var project_ids = {};
  for (var i = 0; i < lookup_file.length; i++) {
    var names = lookup_file[i].projectName || {};
    var name_text = names[lang_key] || names.en || '';
    if (normalizeQuery(String(name_text)).indexOf(q) > -1) { project_ids[lookup_file[i].projectId] = 1; }
  }
  var result = [];
  var seen = {};
  for (var c = 0; c < card_file.length; c++) {
    var proj = card_file[c].projectName || [];
    var list = Array.isArray(proj) ? proj : [proj];
    for (var p = 0; p < list.length; p++) {
      if (project_ids[list[p]] && !seen[card_file[c].treeId]) {
        seen[card_file[c].treeId] = 1;
        result.push(card_file[c].treeId);
      }
    }
  }
  return result;
}

function profileCardPanelCardHtml(card, lang_key) {
  var esc = function(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
  var sci = card.scientificName || '';
  var tree_species_name_db = (typeof __TREE_SPECIES_NAME !== 'undefined' && __TREE_SPECIES_NAME) || [];
  var names_list = [];
  for (var i = 0; i < tree_species_name_db.length; i++) {
    var names = tree_species_name_db[i][sci] || {};
    var n = names[lang_key] || names.en || [];
    if (Array.isArray(n) && n.length) { names_list = n; break; }
  }
  var name_lines = (names_list.length ? names_list : [sci]).map(function (nm) {
    return '<div class="tree-name-line">' + esc(nm) + '</div>';
  }).join('');

  var enc = card['encounters-list'] || {};
  var enc_keys = Object.keys(enc);
  var last_key = enc_keys[enc_keys.length - 1] || '1';
  var last_enc = enc[last_key] || {};
  var hs = last_enc['health-status'] || {};
  var health = String(hs.health || '').trim();
  var health_html = health ? '<div class="health-inline health-' + esc(health.toLowerCase().replace(/\s+/g, '-')) + '">' + esc(health) + '</div>' : '';
  var fmt_stat = function (raw, type) {
    var u = getUnits(type);
    var v = convertLength(raw, u);
    return v + ' ' + u;
  };
  var stats_html = '<span>📏 ' + fmt_stat(hs.height, 'height') + '</span><span>⭕ ' + fmt_stat(hs.diameter, 'diameter') + '</span>';
  var upd = last_enc.updatedBy || last_enc.registeredBy || '—';
  var upd_date = (function (d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
    return m ? m[3] + '-' + m[2] + '-' + m[1] : (d || '—');
  })(last_enc.updatedDate || last_enc.registeredDate);
  var meta_html = '<div>survey ' + esc(last_key) + ' · ' + esc(upd_date) + ' · ' + esc(upd) + ' · ' + '<span class="filter-log-link" onclick="event.stopPropagation();openTreeLogs(\'' + card.treeId + '\')">Log list</span></div>';

  return '<div class="tree-snapshot" onclick="openTreeProfile(\'' + card.treeId + '\')">' +
    '<button type="button" class="card-outgoing-btn" title="Open profile" onclick="event.stopPropagation();openTreeProfile(\'' + card.treeId + '\')"><i class="ti ti-external-link"></i></button>' +
    '<button type="button" class="card-outgoing-btn card-wiki-btn" title="Open in Wikipedia" onclick="event.stopPropagation();openSpeciesInWikipedia(\'' + card.scientificName + '\')"><span class="card-outgoing-w">W</span></button>' +
    '<div class="tree-info">' +
      '<div class="tree-name">' + name_lines + '</div>' +
      '<div class="tree-id">' + esc(card.treeId) + '</div>' +
      '<div class="tree-addr"><button class="gis-pin" type="button" title="Show in map" onclick="event.stopPropagation();showInMap([\'' + card.treeId + '\'])"><i class="ti ti-map-pin"></i></button><span class="addr-text">' + esc(card.placeName || '—') + '</span></div>' +
      '<div class="tree-photo" onclick="event.stopPropagation();openPhotoModal(\'' + esc(card.emoji || '🌳') + '\')"><div class="tree-emoji">' + esc(card.emoji || '🌳') + '</div><button type="button" class="card-zoom-btn" title="Zoom photo" onclick="event.stopPropagation();openPhotoModal(\'' + esc(card.emoji || '🌳') + '\')"><i class="ti ti-zoom-in"></i></button></div>' +
      '<div class="health-stats-row">' + health_html + '<div class="tree-stats">' + stats_html + '</div></div>' +
      '<div class="tree-meta">' + meta_html + '</div>' +
    '</div>' +
  '</div>';
}

function filterLogCardHtml(tree_obj, tree_id, enc_key, enc_entry) {
  var esc = function(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
  var entry_data = enc_entry || {};
  var health_status = entry_data['health-status'] || {};
  var field_obs = entry_data.fieldObservation || {};
  var note_val = field_obs.notes || '—';
  var rec_val = field_obs.recommendations || '—';
  var date_val = entry_data.updatedAt || entry_data.registeredAt || entry_data.registeredDate || entry_data.updatedDate || enc_key || '';
  var surveyed_name = entry_data.registeredBy || entry_data.updatedBy || '—';
  var surveyed_id = entry_data.registererId || entry_data.updaterId || '—';
  var disp_date = (function(d) { var s = String(d || ''); var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s) || /^(\d{4})(\d{2})(\d{2})/.exec(s); return m ? m[3] + '-' + m[2] + '-' + m[1] : s; })(date_val);
  return '<div class="log-entry log-entry-interactive"><div class="log-header"><span>#' + esc(enc_key) + '</span><span>' + esc(disp_date) + '</span></div><div class="log-entry-row" onclick="openTreeProfile(' + "'" + tree_id + "'" + ')"><div class="log-dot log-dot-green"></div><div class="log-body"><div class="log-text">Surveyed By: ' + esc(surveyed_name) + ', ' + esc(surveyed_id) + '</div><div class="log-text">Health: ' + esc(health_status.health || '—') + '</div><div class="log-text">Height: ' + esc(health_status.height || '—') + '</div><div class="log-text">Diameter: ' + esc(health_status.diameter || '—') + '</div><div class="log-text"><span class="log-label-danger">Note:</span> ' + esc(note_val) + '</div><div class="log-text"><span class="log-label-danger">Recommendation:</span> ' + esc(rec_val) + '</div><div class="log-text"><span class="chip-blue" onclick="event.stopPropagation();openFilterReviewPage(' + "'" + tree_id + "'" + ',' + "'" + esc(date_val) + "'" + ')"><i class="ti ti-eye"></i> Review</span></div></div></div></div>';
}

function summaryPanelCardHtml(species_name, count, search_value, scientific_name) {
  return '<span class="chip-big"><span class="album-chip chip-click" title="Filter by species" data-tree-name="' + String(search_value || species_name).replace(/"/g, '&quot;') + '">' + species_name + ' <b>– ' + count + '</b></span>' +
    '<button type="button" class="album-chip-w" title="Open in Wikipedia" onclick="event.stopPropagation();openSpeciesInWikipedia(\'' + String(scientific_name || '').replace(/'/g, "\\'") + '\')">W</button></span>';
}

function openMap(tree_ids) {
  showInMap(tree_ids || []);
}

var filterLogsPlace = '';
var filterLogsTree = '';
var filterLogsScroll = '0';
var filterLogsTreeId = '';
function filterLogsBack() {
  var place_val = window.filterLogsPlace || '';
  var tree_val = window.filterLogsTree || '';
  var scroll_val = window.filterLogsScroll || '';
  try {
    if (!place_val) place_val = sessionStorage.getItem('filterLogsPlace') || '';
    if (!tree_val) tree_val = sessionStorage.getItem('filterLogsTree') || '';
    if (!scroll_val) scroll_val = sessionStorage.getItem('filterLogsScroll') || '0';
  } catch (e) {}
  var place_el = document.getElementById('album-place');
  var tree_el = document.getElementById('album-tree');
  if (place_el) place_el.value = place_val;
  if (tree_el) tree_el.value = tree_val;
  try { syncClearButtons(); } catch (e2) {}
  try { runSearch(); } catch (e3) {}
  var containers = document.querySelectorAll('.album-container');
  var search_wrap = containers[0] || null;
  var logs_wrap = document.getElementById('album-logs');
  if (logs_wrap) logs_wrap.classList.add('hidden');
  if (search_wrap) search_wrap.classList.remove('hidden');
  var hero_back = document.getElementById('main-hero');
  if (hero_back) hero_back.classList.remove('hidden');
  var filters_back = document.querySelector('.album-filters');
  if (filters_back) filters_back.classList.remove('hidden');
  var container_el = search_wrap || document.querySelector('.album-container');
  if (container_el) {
    var target_scroll = parseInt(scroll_val, 10) || 0;
    container_el.scrollTop = target_scroll;
    requestAnimationFrame(function() { container_el.scrollTop = target_scroll; });
  }
}
function openTreeLogs(tree_id) {
  var place_input = (document.getElementById('album-place') || {}).value || '';
  var tree_input = (document.getElementById('album-tree') || {}).value || '';
  var container_node = document.querySelector('.album-container');
  var scroll_pos = container_node ? container_node.scrollTop : 0;
  window.filterLogsPlace = place_input;
  window.filterLogsTree = tree_input;
  window.filterLogsScroll = String(scroll_pos);
  window.filterLogsTreeId = tree_id || '';
  try { sessionStorage.setItem('filterLogsPlace', place_input); sessionStorage.setItem('filterLogsTree', tree_input); sessionStorage.setItem('filterLogsScroll', String(scroll_pos)); sessionStorage.setItem('filterLogsTreeId', tree_id || ''); } catch (e) {}
  var data_list = window.__TREE_DATA || [];
  var target_tree = null;
  for (var i = 0; i < data_list.length; i++) { if (data_list[i].treeId === tree_id) { target_tree = data_list[i]; break; } }
  if (!target_tree) return;
  var grid_el = document.getElementById('album-logs-list');
  if (!grid_el) return;
  var enc_map = target_tree['encounters-list'] || {};
  var enc_keys = Object.keys(enc_map);
  enc_keys.sort(function(a_key, b_key) {
    var a_entry = enc_map[a_key] || {};
    var b_entry = enc_map[b_key] || {};
    var a_date = a_entry.updatedAt || a_entry.registeredAt || a_entry.registeredDate || a_entry.updatedDate || a_key || '';
    var b_date = b_entry.updatedAt || b_entry.registeredAt || b_entry.registeredDate || b_entry.updatedDate || b_key || '';
    var date_cmp = String(b_date).localeCompare(String(a_date));
    if (date_cmp !== 0) return date_cmp;
    var a_num = parseInt(a_key, 10);
    var b_num = parseInt(b_key, 10);
    var both_num = isNaN(a_num) || isNaN(b_num) ? false : true;
    return both_num ? b_num - a_num : String(b_key).localeCompare(String(a_key));
  });
  var html_str = '';
  for (var idx = 0; idx < enc_keys.length; idx++) { html_str += filterLogCardHtml(target_tree, tree_id, enc_keys[idx], enc_map[enc_keys[idx]]); }
  grid_el.innerHTML = html_str || '<div class="no-trees">No logs yet</div>';
  var title_el = document.getElementById('album-logs-title');
  if (title_el) title_el.innerHTML = tree_id + ' — Logs';
  var containers = document.querySelectorAll('.album-container');
  var search_wrap = containers[0] || null;
  var logs_wrap = document.getElementById('album-logs');
  if (search_wrap) search_wrap.classList.add('hidden');
  if (logs_wrap) { logs_wrap.classList.remove('hidden'); logs_wrap.scrollTop = 0; }
  var hero_el = document.getElementById('main-hero');
  if (hero_el) hero_el.classList.add('hidden');
  var filters_el = document.querySelector('.album-filters');
  if (filters_el) filters_el.classList.add('hidden');
}

function openFilterReviewPage(tree_id, logged_at) {
  var place_val = (document.getElementById('album-place') || {}).value || '';
  var tree_val = (document.getElementById('album-tree') || {}).value || '';
  var containers = document.querySelectorAll('.album-container');
  var search_wrap = containers[0] || null;
  var logs_wrap = document.getElementById('album-logs');
  var search_scroll = search_wrap ? search_wrap.scrollTop : 0;
  var log_scroll = logs_wrap ? logs_wrap.scrollTop : 0;
  try {
    search_scroll = parseInt(window.filterLogsScroll || search_scroll, 10) || search_scroll;
  } catch (e) {}
  var log_tree = window.filterLogsTreeId || tree_id || '';
  var qp = new URLSearchParams();
  qp.set('place', place_val);
  qp.set('tree', tree_val);
  qp.set('scroll', String(search_scroll));
  qp.set('logtree', log_tree);
  qp.set('logscroll', String(log_scroll));
  var parent_url = encodeURIComponent('filter.html?' + qp.toString());
  var log_date = logged_at || '';
  window.location.href = 'review-page.html?treeId=' + encodeURIComponent(tree_id) + '&loggedAt=' + encodeURIComponent(log_date) + '&parent=' + parent_url;
}

function loadSummaryPanel(tree_ids) {
  var summaryEl = document.getElementById('album-summary');
  var countEl = document.getElementById('album-count');
  if (!summaryEl) return;
  var lang_key = (typeof filterLang !== 'undefined' && filterLang) || (typeof appLang !== 'undefined' && appLang) || 'en';
  var groups = {};
  var search_names = {};
  var sci_names = {};
  var total = 0;
  (tree_ids || []).forEach(function (id) {
    var c = storage.pullTreeDetail(id);
    if (!c) return;
    total++;
    var sci = c.scientificName || '';
    var name = sci;
    var tree_species_name_db = (typeof __TREE_SPECIES_NAME !== 'undefined' && __TREE_SPECIES_NAME) || [];
    for (var i = 0; i < tree_species_name_db.length; i++) {
      var names = tree_species_name_db[i][sci] || {};
var n = names[lang_key] || names.en || [];
      if (Array.isArray(n) && n.length) { name = n.join(', '); var first_name = n[0]; break; }
    }
    if (!groups[name]) { groups[name] = 0; search_names[name] = first_name || name; sci_names[name] = sci; }
    groups[name]++;
  });
  if (total === 0) {
    summaryEl.classList.add('hidden');
    summaryEl.innerHTML = '';
    if (countEl) { countEl.innerHTML = '<span class="album-count-line">0 species</span><span class="album-count-line">0 trees</span>'; }
    return;
  }
  var keys = Object.keys(groups).sort(function (a, b) {
    try { return a.localeCompare(b, lang_key, { sensitivity: 'base' }); } catch (e) { return a.localeCompare(b); }
  });
  summaryEl.innerHTML = keys.map(function (k) { return summaryPanelCardHtml(k, groups[k], search_names[k], sci_names[k]); }).join('');
  summaryEl.querySelectorAll('.chip-click').forEach(function (chip) {
    chip.onclick = function () { filterByTree(chip.getAttribute('data-tree-name')); };
  });
  var mapBtn = document.createElement('button');
  mapBtn.type = 'button';
  mapBtn.className = 'map-btn';
  mapBtn.innerHTML = '<i class="ti ti-map-2"></i> Show in map';
  mapBtn.onclick = function () { openMap(tree_ids); };
  summaryEl.appendChild(mapBtn);
  window._summaryOpen === false ? summaryEl.classList.add('hidden') : summaryEl.classList.remove('hidden');
  if (countEl) { countEl.innerHTML = '<span class="album-count-line">' + keys.length + ' species</span><span class="album-count-line">' + total + ' trees</span>'; }
}

function loadProfileCardPanel(tree_ids) {
  var grid = document.getElementById('album-grid');
  if (!grid) return;
  var lang_key = (typeof filterLang !== 'undefined' && filterLang) || (typeof appLang !== 'undefined' && appLang) || 'en';
  var cards = (tree_ids || []).map(function (id) { return storage.pullTreeDetail(id); }).filter(function (c) { return !!c; });
  grid.innerHTML = cards.length ? cards.map(function (c) { return profileCardPanelCardHtml(c, lang_key); }).join('') : '<div class="no-trees">No trees found</div>';
}

function applySearchResults(results) {
  var ids = results || [];
  loadSummaryPanel(ids);
  loadProfileCardPanel(ids);
}

function runSearch() {
  var place_val = (document.getElementById('album-place') || {}).value || '';
  var tree_val = (document.getElementById('album-tree') || {}).value || '';
  var qp = place_val.trim();
  var qt = tree_val.trim();

  var card_file = (window.__TREE_DATA || []).filter(function (t) {
    var e1 = (t['encounters-list'] || {})['1'] || {};
    return (e1.acceptance || {}).status === 'accepted';
  });

  var place_ids = null;
  if (qp) {
    var s = {};
    var scan = function (ids) {
      (ids || []).forEach(function (id) { s[id] = 1; });
    };
    if (/^\d{6,}/.test(qp)) { scan(searchByPinCode(qp, card_file)); scan(searchByTreeId(qp, card_file)); }
    else {
      scan(searchByPlaceName(qp, card_file, __PLACES || []));
      scan(searchByProjectName(qp, card_file, __PROJECTS || []));
      scan(searchByTreeId(qp, card_file));
    }
    place_ids = s;
  }

  var tree_ids = null;
  if (qt) {
    var set2 = {};
    searchBySpeciesName(qt, card_file, (typeof __TREE_SPECIES_NAME !== 'undefined' && __TREE_SPECIES_NAME) || []).forEach(function (id) { set2[id] = 1; });
    tree_ids = set2;
  }

  var result = card_file.map(function (t) { return t.treeId; });
  if (place_ids) { result = result.filter(function (id) { return place_ids[id]; }); }
  if (tree_ids) { result = result.filter(function (id) { return tree_ids[id]; }); }
  applySearchResults(result);
}

function onInput(el) {
  if (el && el.isComposing) return;
  var raw = String(el && el.value || '');
  var stripped = raw.replace(/[\u00A0\u200B\u200C\u200D\uFEFF]+$/g, '').replace(/\s+$/g, '');
  if (stripped !== raw) {
    var pos = el.selectionStart;
    el.value = stripped;
    try { el.setSelectionRange(pos - (raw.length - stripped.length), pos - (raw.length - stripped.length)); } catch (e) {}
  }
  var btn = el && el.parentNode ? el.parentNode.querySelector('.clear-btn') : null;
  if (btn) btn.disabled = !String(el && el.value || '').trim();
  if (el && el.id === 'album-place') renderSuggestionBox(document.getElementById('album-suggest'), __PLACE_SUGGESTIONS || [], el.value);
  if (el && el.id === 'album-tree') renderSuggestionBox(document.getElementById('album-suggest-tree'), __TREE_SUGGESTIONS || [], el.value);
  runSearch();
}

function syncClearButtons() {
  ['album-place', 'album-tree'].forEach(function (id) {
    var el = document.getElementById(id);
    var btn = el && el.parentNode ? el.parentNode.querySelector('.clear-btn') : null;
    if (btn) btn.disabled = !String(el.value || '').trim();
  });
}

function clearInput(id) {
  var el = document.getElementById(id);
  if (el) el.value = '';
  var btn = el.parentNode ? el.parentNode.querySelector('.clear-btn') : null;
  if (btn) btn.disabled = true;
  runSearch();
}

function filterByTree(name) {
  var el = document.getElementById('album-tree');
  if (el) el.value = name;
  var btn = el && el.parentNode ? el.parentNode.querySelector('.clear-btn') : null;
  if (btn) btn.disabled = false;
  var box = document.getElementById('album-suggest');
  if (box) box.classList.remove('open');
  runSearch();
}

// ---- helpers adapted from filter.js ----
function filterBack() {
  var parent_url = new URLSearchParams(location.search).get('parent');
  if (parent_url) { window.location.href = parent_url; return; }
  if (window.history.length > 1) { window.history.back(); return; }
  window.location.href = 'filter.html';
}

function closeMapModal() { var m = document.getElementById('map-modal'); if (m) { m.classList.remove('open'); } var f = document.getElementById('map-frame'); if (f) f.src = ''; }
function openPhotoModal(emoji) { var e = document.getElementById('photo-modal-emoji'); if (e) e.textContent = emoji || '🌳'; var m = document.getElementById('photo-modal'); if (m) { m.classList.add('open'); } }
function closePhotoModal() { var m = document.getElementById('photo-modal'); if (m) m.classList.remove('open'); }

function openTreeProfile(treeId) {
  var container = document.querySelector('.album-container');
  var scroll_pos = container ? container.scrollTop : 0;
  try { sessionStorage.setItem('filterScrollTop', String(scroll_pos)); } catch (e) {}
  var place = (document.getElementById('album-place') || {}).value || '';
  var tree = (document.getElementById('album-tree') || {}).value || '';
  var qp = new URLSearchParams(location.search);
  qp.set('place', place);
  qp.set('tree', tree);
  qp.set('scroll', String(scroll_pos));
  var parent_url = encodeURIComponent('filter.html?' + qp.toString());
  try { sessionStorage.setItem('gobackFromTreeProfile', decodeURIComponent(parent_url)); } catch (e) {}
  var flang = 'flang=' + encodeURIComponent(filterLang);
  window.location.href = 'individual-tree-profile.html?treeId=' + encodeURIComponent(treeId) + '&from=filter&parent=' + parent_url + '&' + flang;
}

function restoreFilterScrollPosition(scroll_value) {
  if (!scroll_value) return;
  try { sessionStorage.removeItem('filterScrollTop'); } catch (e) {}
  var container = document.querySelector('.album-container');
  if (container) {
    var target_scroll = parseInt(scroll_value, 10) || 0;
    container.scrollTop = target_scroll;
    requestAnimationFrame(function () {
      container.scrollTop = target_scroll;
    });
  }
}

function populatePlaceSuggestions() {
  var lang_key = (typeof filterLang !== 'undefined' && filterLang) || 'en';
  __PLACE_SUGGESTIONS = [];
  var seen = {};
  function add(value) {
    if (!value) return;
    if (seen[value]) return;
    seen[value] = 1;
    __PLACE_SUGGESTIONS.push({ value: value, label: value });
  }
  (__PLACES || []).forEach(function (p) {
    add(p.placeName[lang_key] || p.placeName.en);
    add(String(p.pinCode));
  });
  (__PROJECTS || []).forEach(function (pr) {
    add(pr.projectName[lang_key] || pr.projectName.en);
  });
  (window.__TREE_DATA || []).forEach(function (t) { add(String(t.treeId)); });
}

function populateTreeSuggestions() {
  var lang_key = (typeof filterLang !== 'undefined' && filterLang) || 'en';
  __TREE_SUGGESTIONS = [];
  var seen = {};
  function add(value) {
    if (!value) return;
    if (seen[value]) return;
    seen[value] = 1;
    __TREE_SUGGESTIONS.push({ value: value, label: value });
  }
  (typeof __TREE_SPECIES_NAME !== 'undefined' ? __TREE_SPECIES_NAME : []).forEach(function (entry) {
    var sci = Object.keys(entry)[0];
    var names = entry[sci] || {};
    var n = names[lang_key] || names.en || [];
    if (Array.isArray(n)) { n.forEach(function (nm) { add(nm); }); }
  });
}

function renderSuggestionBox(box_el, pool, query) {
  if (!box_el) return;
  var q = String(query || '').toLowerCase().trim();
  if (!q) { box_el.classList.remove('open'); return; }
  var list = pool.filter(function (s) { return s.value.toLowerCase().indexOf(q) > -1; });
  if (list.length === 0) { box_el.classList.remove('open'); return; }
  box_el.innerHTML = '';
  list.slice(0, 8).forEach(function (s) {
    var item = document.createElement('div');
    item.className = 'album-suggest-item';
    item.textContent = s.label;
    item.onclick = function () { chooseSuggestionForBox(s, box_el); };
    box_el.appendChild(item);
  });
  box_el.classList.add('open');
}

function chooseSuggestionForBox(s, box_el) {
  var target_el = null;
  if (box_el.id === 'album-suggest') { target_el = document.getElementById('album-place'); }
  else if (box_el.id === 'album-suggest-tree') { target_el = document.getElementById('album-tree'); }
  if (target_el) target_el.value = s.value;
  var btn = target_el && target_el.parentNode ? target_el.parentNode.querySelector('.clear-btn') : null;
  if (btn) btn.disabled = false;
  if (box_el) box_el.classList.remove('open');
  runSearch();
}
document.addEventListener('click', function (e) {
  var place_box = document.getElementById('album-suggest');
  var tree_box = document.getElementById('album-suggest-tree');
  var place_wrap = document.getElementById('album-place') ? document.getElementById('album-place').parentNode : null;
  var tree_wrap = document.getElementById('album-tree') ? document.getElementById('album-tree').parentNode : null;
  if (place_box && place_wrap && !place_wrap.contains(e.target)) place_box.classList.remove('open');
  if (tree_box && tree_wrap && !tree_wrap.contains(e.target)) tree_box.classList.remove('open');
});

function applyFilterPlaceholders() {
  var placeholders = storage.get('placeholderTexts') || {};
  var lang = filterLang || appLang || 'en';
  var ph = placeholders[lang] || placeholders['en'] || {};
  var place_el = document.getElementById('album-place');
  var tree_el = document.getElementById('album-tree');
  if (place_el && ph['album-place']) place_el.placeholder = ph['album-place'];
  if (tree_el && ph['album-tree']) tree_el.placeholder = ph['album-tree'];
  [place_el, tree_el].forEach(function (el) {
    if (!el) return;
    el.className = el.className.replace(/\bplaceholder-text-\S+/g, '').trim();
    el.classList.add('placeholder-text-' + lang);
  });
}

function toggleSummary() {
  window._summaryOpen = window._summaryOpen === false ? true : false;
  var t = document.getElementById('summary-toggle');
  if (t) t.classList.toggle('off', window._summaryOpen === false);
  runSearch();
}

window.render = {
  init: function () {
    __PLACES = storage.get('places') || [];
    storage.syncTreeCards();
    window.TREE_COLOURS = storage.get('treeColours') || [];
    window.__login = storage.get('login') || {};
    filterLang = appLang;
    var qp = new URLSearchParams(location.search);
    var userid = (qp.get('userid') || qp.get('role') || '').trim();
    var hero = document.getElementById('main-hero');
    var back_btn = document.getElementById('filter-back');
    if (userid && hero) { hero.setAttribute('data-role', userid.toLowerCase()); hero.classList.remove('hidden'); }
    if (back_btn) { if (qp.get('parent')) back_btn.classList.remove('hidden'); else back_btn.classList.add('hidden'); }
    var place_el = document.getElementById('album-place');
    var tree_el = document.getElementById('album-tree');
    var saved_scroll = qp.get('scroll');
    if (!saved_scroll) {
      try { saved_scroll = sessionStorage.getItem('filterScrollTop'); } catch (e) {}
    }
    if (qp.get('place') || qp.get('tree') || qp.get('scroll')) {
      if (place_el) place_el.value = qp.get('place') || '';
      if (tree_el) tree_el.value = qp.get('tree') || '';
      var kept = new URLSearchParams(location.search);
      kept.delete('place');
      kept.delete('tree');
      kept.delete('scroll');
      kept.delete('logtree');
      kept.delete('logscroll');
      history.replaceState(null, '', 'filter.html' + (kept.toString() ? '?' + kept.toString() : ''));
    }
    syncClearButtons();
    populatePlaceSuggestions();
    populateTreeSuggestions();
    applyFilterPlaceholders();
    runSearch();
    restoreFilterScrollPosition(saved_scroll);
    var logs_back_init = document.getElementById('logs-back-btn');
    if (logs_back_init) logs_back_init.classList.add('hidden');
    var log_tree = qp.get('logtree') || '';
    var log_scroll = qp.get('logscroll') || '';
    if (log_tree && typeof openTreeLogs === 'function') {
      openTreeLogs(log_tree);
      var logs_wrap = document.getElementById('album-logs');
      if (logs_wrap) {
        var target_log_scroll = parseInt(log_scroll, 10) || 0;
        logs_wrap.scrollTop = target_log_scroll;
        requestAnimationFrame(function() { logs_wrap.scrollTop = target_log_scroll; });
      }
    }
  }
};

window.addEventListener('pageshow', function () {
  try {
    var saved_scroll = sessionStorage.getItem('filterScrollTop');
    if (saved_scroll) restoreFilterScrollPosition(saved_scroll);
  } catch (e) {}
});