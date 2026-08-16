// append-a-tree-name.js — reads trees_name.json cache (populated by filter.js; only index reads the JSON) and appends new tree names.

var TREE_NAMES_DB = [];

function loadTreeNames(cb) {
  if (TREE_NAMES_DB.length > 0) { if (cb) { cb(); } return; }
  if (window.TREE_NAMES_DB) { TREE_NAMES_DB = window.TREE_NAMES_DB; if (cb) { cb(); } return; }
  try {
    var s = localStorage.getItem('treeNamesV1');
    if (s) { TREE_NAMES_DB = JSON.parse(s); if (cb) { cb(); } return; }
  } catch (e) {}
  if (cb) { cb(); }
}

function appendTreeName(treeName) {
  var next_id = TREE_NAMES_DB.length > 0
    ? TREE_NAMES_DB[TREE_NAMES_DB.length - 1].id + 1
    : 1;
  var entry = {
    id: next_id,
    name: {
      ta: treeName.localName || '',
      en: treeName.englishName || '',
      sn: treeName.scientificName || ''
    },
    variety: []
  };
  TREE_NAMES_DB.push(entry);
  return entry;
}