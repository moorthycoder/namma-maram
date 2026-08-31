function navigateToLoginHubPage(page) {
  window.location.href = page;
}

function initializeLoginHubNavigation() {
  var pages = ['sponsor.html?hub=login','care-giver.html?hub=login','ten-trees-ranger.html?hub=login','project-leader.html?hub=login','ranger.html?hub=login','surveyor.html?hub=login','admin.html?hub=login'];
  var tiles = document.querySelectorAll('.hub-grid .hub-tile');
  tiles.forEach(function (tile, index) {
    var target_page = pages[index];
    if (target_page) {
      tile.addEventListener('click', function () { navigateToLoginHubPage(target_page); });
    }
  });
}

document.addEventListener('DOMContentLoaded', initializeLoginHubNavigation);
