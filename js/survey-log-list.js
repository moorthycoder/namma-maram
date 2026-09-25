// survey-log-list.js — log-list element only, copied from filter2.js pattern
// Expects survey-log-list.html: #album-logs-list, #album-logs-title

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

function getSurveyLogTreeId() {
  var tree_param = new URLSearchParams(window.location.search).get('treeId');
  var tree_id = tree_param ? tree_param : '';
  return tree_id;
}

function getSurveyLogParentPage() {
  var parent_param = new URLSearchParams(window.location.search).get('parent');
  var parent_page = parent_param ? parent_param : '';
  return parent_page;
}

function buildSurveyLogParentUrl(target_id) {
  var grand_parent = getSurveyLogParentPage();
  var base_url = 'survey-log-list.html?treeId=' + encodeURIComponent(target_id);
  var full_url = grand_parent ? base_url + '&parent=' + encodeURIComponent(grand_parent) : base_url;
  return full_url;
}

function pullSurveyLogTreeDetail(tree_id) {
  try { storage.syncTreeCards(); } catch (sync_error) {}
  var card_detail = (typeof storage.pullTreeDetail === 'function') ? storage.pullTreeDetail(tree_id) : null;
  if (card_detail) return card_detail;
  var data_list = window.__TREE_DATA || [];
  for (var i = 0; i < data_list.length; i++) { if (data_list[i].treeId === tree_id) return data_list[i]; }
  return null;
}

function renderSurveyLogListCards(enc_map, tree_id) {
  var grid_el = document.getElementById('album-logs-list');
  if (!grid_el) return false;
  var enc_keys = Object.keys(enc_map || {});
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
  for (var idx = 0; idx < enc_keys.length; idx++) { html_str += filterLogCardHtml(null, tree_id, enc_keys[idx], enc_map[enc_keys[idx]]); }
  grid_el.innerHTML = html_str || '<div class="no-trees">No logs yet</div>';
  return true;
}

function renderSurveyLogListTitle(tree_id) {
  var title_el = document.getElementById('survey-log-title') || document.getElementById('album-logs-title');
  title_el ? title_el.textContent = tree_id + ' — Logs' : null;
  return true;
}

function openTreeLogs(tree_id) {
  var target_id = tree_id || getSurveyLogTreeId();
  if (!target_id) return false;
  var target_tree = pullSurveyLogTreeDetail(target_id);
  if (!target_tree) return false;
  var enc_map = target_tree['encounters-list'] || {};
  renderSurveyLogListTitle(target_id);
  return renderSurveyLogListCards(enc_map, target_id);
}

function filterLogsBack() {
  var parent_page = getSurveyLogParentPage();
  var has_parent = parent_page ? true : false;
  if (has_parent) { window.location.assign(parent_page); return true; }
  var has_history = window.history.length > 1 ? true : false;
  has_history ? window.history.back() : window.location.assign('filter.html');
  return true;
}

function filterBack() {
  return filterLogsBack();
}

function openTreeProfile(tree_id) {
  var target_id = tree_id || getSurveyLogTreeId();
  var parent_page = buildSurveyLogParentUrl(target_id);
  var profile_url = 'individual-tree-profile.html?treeId=' + encodeURIComponent(target_id) + '&parent=' + encodeURIComponent(parent_page);
  window.location.assign(profile_url);
  return true;
}

function openFilterReviewPage(tree_id, logged_at) {
  var target_id = tree_id || getSurveyLogTreeId();
  var log_date = logged_at || '';
  var parent_url = encodeURIComponent(buildSurveyLogParentUrl(target_id));
  window.location.assign('review-page.html?treeId=' + encodeURIComponent(target_id) + '&loggedAt=' + encodeURIComponent(log_date) + '&parent=' + parent_url);
  return true;
}

function initSurveyLogListPage() {
  var tree_id = getSurveyLogTreeId();
  tree_id ? openTreeLogs(tree_id) : null;
  return true;
}

window.render = {
  init: function () {
    try { storage.syncTreeCards(); } catch (sync_error) {}
    initSurveyLogListPage();
  }
};

document.addEventListener('DOMContentLoaded', function () {
  initSurveyLogListPage();
});
