function navigateToRegisterHubPage(page) {
  window.location.href = page;
}

function initializeRegisterHubNavigation() {
  var pages = ['sponsor.html?hub=register','care-giver.html?hub=register','ten-trees-ranger.html?hub=register','project-leader.html?hub=register','project-member.html?hub=register','','ranger.html?hub=register','surveyor.html?hub=register'];
  var tiles = document.querySelectorAll('.hub-grid .hub-tile');
  tiles.forEach(function (tile, index) {
    if (tile.classList.contains('disabled') || tile.classList.contains('empty')) return;
    var target_page = pages[index];
    if (target_page) {
      tile.addEventListener('click', function () { navigateToRegisterHubPage(target_page); });
    }
  });
}

document.addEventListener('DOMContentLoaded', initializeRegisterHubNavigation);
