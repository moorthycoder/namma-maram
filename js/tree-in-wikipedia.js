// tree-in-wikipedia.js — open the tree species on Wikipedia from a tree profile.

function getWikipediaUrl(sn) {
  var exceptions = window.TREE_SPECIES_NAME_EXCEPTION || storage.get('treeSpeciesNameException') || [];
  var map = {};
  exceptions.forEach(function (e) { if (e && e.sn) { map[e.sn] = e.wikipedia; } });
  var title = map[sn] || String(sn || '').trim().replace(/\s+/g, '_');
  return 'https://en.wikipedia.org/wiki/' + title;
}

function openSpeciesInWikipedia(sn) {
  if (!sn) return;
  var url = getWikipediaUrl(sn);
  if (url) {
    window.open(url, '_blank');
  }
}