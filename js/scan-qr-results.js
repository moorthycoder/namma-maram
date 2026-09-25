(function () {
  const results_tree_card_element = document.querySelector('.results-tree-card');

  const getResultsTreeId = () => {
    const tree_param = new URLSearchParams(window.location.search).get('treeId');
    const tree_id = tree_param ? tree_param : '625501-06-0001';
    return tree_id;
  };

  const getResultsParentPage = () => {
    const parent_param = new URLSearchParams(window.location.search).get('parent');
    const parent_page = parent_param ? parent_param : 'welcome.html';
    return parent_page;
  };

  const openTreeProfileFromResults = (event_object) => {
    const tree_id = getResultsTreeId();
    const parent_page = getResultsParentPage();
    const nested_parent = 'scan-qr-results.html?treeId=' + encodeURIComponent(tree_id) + '&parent=' + encodeURIComponent(parent_page);
    const profile_url = 'individual-tree-profile.html?treeId=' + encodeURIComponent(tree_id) + '&parent=' + encodeURIComponent(nested_parent);
    window.location.assign(profile_url);
    return true;
  };

  const renderResultsTreeCard = () => {
    const tree_id = getResultsTreeId();
    try { storage.syncTreeCards(); } catch (sync_error) {}
    const card_detail = (typeof storage.pullTreeDetail === 'function') ? storage.pullTreeDetail(tree_id) : null;
    const has_card = card_detail ? true : false;
    const lang_key = (typeof filterLang !== 'undefined' && filterLang) || (typeof appLang !== 'undefined' && appLang) || 'en';
    const card_html = (has_card && typeof profileCardPanelCardHtml === 'function') ? profileCardPanelCardHtml(card_detail, lang_key) : '';
    results_tree_card_element ? results_tree_card_element.innerHTML = card_html : null;
    return has_card;
  };

  const openSurveyLogListFromResults = (tree_id) => {
    const target_id = tree_id || getResultsTreeId();
    const parent_page = getResultsParentPage();
    const nested_parent = 'scan-qr-results.html?treeId=' + encodeURIComponent(target_id) + '&parent=' + encodeURIComponent(parent_page);
    const log_url = 'survey-log-list.html?treeId=' + encodeURIComponent(target_id) + '&parent=' + encodeURIComponent(nested_parent);
    window.location.assign(log_url);
    return true;
  };

  window.openTreeProfile = openTreeProfileFromResults;
  window.openTreeLogs = openSurveyLogListFromResults;
  renderResultsTreeCard();
})();

function goBackFromScanResults() {
  var parent_param = new URLSearchParams(window.location.search).get('parent') || '';
  var has_parent = parent_param ? true : false;
  var scan_parent = has_parent ? parent_param : 'welcome.html';
  var is_profile_loop = scan_parent.indexOf('individual-tree-profile') !== -1 ? true : false;
  var effective_parent = is_profile_loop ? 'welcome.html' : scan_parent;
  var final_url = 'scan-qr.html?parent=' + encodeURIComponent(effective_parent);
  window.location.assign(final_url);
  return true;
}
