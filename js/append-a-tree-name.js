// append-a-tree-name.js — reads trees_name.json cache (populated by filter.js; only index reads the JSON) and appends new tree names.
// Entry format: { "<scientificName>": { en, ta, te, kn, ml, si, kok, tcy }, "variety": [ { en, ta, te, kn, ml, si, kok, tcy } ] }

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
  var botanicalName = treeName.scientificName || '';
  var entry = {};
  entry[botanicalName] = {
    en: treeName.englishName || '',
    ta: treeName.localName || '',
    te: null,
    kn: null,
    ml: null,
    si: null,
    kok: null,
    tcy: null
  };
  entry.variety = [];
  TREE_NAMES_DB.push(entry);
  return entry;
}