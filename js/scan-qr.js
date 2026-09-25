(function () {
  const scan_btn_element = document.querySelector('.scan-start-btn');
  const scan_scanning_element = document.querySelector('.scan-scanning-text');

  const followLink = (scanned_text) => {
    const target_url = (scanned_text || '').trim();
    const is_valid_link = /^https?:\/\//i.test(target_url) ? true : false;
    is_valid_link ? window.location.assign(target_url) : null;
    return is_valid_link;
  };

  const startQRScan = (event_object) => {
    const target_element = event_object ? event_object.currentTarget : scan_btn_element;
    target_element ? target_element.classList.add('pressed') : null;
    setTimeout(() => {
      target_element ? target_element.classList.remove('pressed') : null;
    }, 150);
    scan_btn_element ? scan_btn_element.classList.add('hidden') : null;
    scan_scanning_element ? scan_scanning_element.classList.remove('hidden') : null;
    setTimeout(() => {
      const raw_parent = new URLSearchParams(window.location.search).get('parent');
      const scan_parent = raw_parent ? raw_parent : 'welcome.html';
      const results_url = 'scan-qr-results.html?treeId=' + encodeURIComponent('625501-06-0001') + '&parent=' + encodeURIComponent(scan_parent);
      window.location.assign(results_url);
    }, 3000);
    return true;
  };

  const wireScanParamToFollowLink = () => {
    const scan_param = new URLSearchParams(window.location.search).get('scan');
    const has_scan_param = scan_param ? true : false;
    has_scan_param ? followLink(scan_param) : null;
    return has_scan_param;
  };

  scan_btn_element ? scan_btn_element.addEventListener('click', startQRScan) : null;
  wireScanParamToFollowLink();
})();

function goBackFromScanQRToWelcome() {
  var parent_param = new URLSearchParams(window.location.search).get('parent') || '';
  var has_parent = parent_param ? true : false;
  var target_url = has_parent ? parent_param : 'welcome.html';
  var is_profile_loop = target_url.indexOf('individual-tree-profile') !== -1 ? true : false;
  var final_url = is_profile_loop ? 'welcome.html' : target_url;
  window.location.assign(final_url);
  return true;
}
