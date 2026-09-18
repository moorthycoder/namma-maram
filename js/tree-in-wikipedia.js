// tree-in-wikipedia.js — open the tree species on Wikipedia from a tree profile.

function getWikipediaUrl(sn) {
  var exceptions = window.TREE_SPECIES_NAME_EXCEPTION || storage.get('treeSpeciesNameException') || [];
  var map = {};
  exceptions.forEach(function (e) { if (e && e.sn) { map[e.sn] = e.wikipedia; } });
  var title = map[sn] || String(sn || '').trim().replace(/\s+/g, '_');
  return 'https://en.wikipedia.org/wiki/' + title;
}

function openMoreDetails() {
  var tree = (window.__TREE_DATA || storage.get('treeCards') || []).find(function(t){ return t.treeId===profileTreeId; });
  var sci = tree ? tree.scientificName : '';
  if (!sci) return;
  window.open(getWikipediaUrl(sci), '_blank');
}

function openSpeciesInWikipedia(sci) {
  if (!sci) return;
  window.open(getWikipediaUrl(sci), '_blank');
}