// show-tree-details.js — shared helpers to open map.html with full tree card details.

function treeMapCoords(t) {
  return t.GIS.latitude + ',' + t.GIS.longitude + ',' + encodeURIComponent(t.treeId);
}

function hasTreeGis(t) {
  return !!(t && t.GIS && typeof t.GIS.latitude === 'number' && typeof t.GIS.longitude === 'number');
}

function showTreeDetailsInMap(tree) {
  if (hasTreeGis(tree)) {
    showMap(treeMapCoords(tree));
  } else {
    alert('Location not available for this tree.');
  }
}
