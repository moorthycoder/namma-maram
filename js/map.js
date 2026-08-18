
  function initMap() {
    var src = new URLSearchParams(location.search).get('coords') || '';

    var markers = src.split('|')
      .filter(function(p){ return p && p.indexOf(',') > -1; })
      .map(function(p){ var a = p.split(','); return { lat: parseFloat(a[0]), lng: parseFloat(a[1]), id: a.length > 2 ? decodeURIComponent(a[2]) : '' }; })
      .filter(function(c){ return !isNaN(c.lat) && !isNaN(c.lng); });

    if (!markers.length) {
      document.getElementById('map').innerHTML = '<div style="padding:40px;font-size:15px;">No coordinates provided.</div>';
      return;
    }

    var byId = {};
    try {
      if (window.parent && window.parent !== window && Array.isArray(window.parent.albumData)) {
        window.parent.albumData.forEach(function(t){
          if (t && t.treeId) { byId[t.treeId] = t; }
        });
      }
    } catch (e) {}

    drawMap(markers, byId);
  }

  function recordToInfo(record, id) {
    if (!record) {
      return { type: 'Tree', localName: '', treeId: id, address: '', caregiver: '', careGiverContact: '', emoji: '🌳', health: '', height: '', diameter: '' };
    }
    return {
      type: record.englishName || 'Tree',
      localName: record.localName || '',
      treeId: record.treeId || '',
      address: record.address || '',
      caregiver: record['care-giver'] || '',
      careGiverContact: record['care-giver-contact-number'] || '',
      emoji: record.emoji || '🌳',
      health: record.health || '',
      height: record.height || '',
      diameter: record.diameter || ''
    };
  }

  function drawMap(markers, byId) {
    var typeColor = {};
    var colorOrder = [];
    markers.forEach(function(c) {
      var treeType = recordToInfo(byId[c.id], c.id).type;
      if (typeColor[treeType] === undefined) {
        typeColor[treeType] = colorOrder.length;
        colorOrder.push(treeType);
      }
    });

    var palette = ['#DC2626'];
    if (window.TREE_COLOURS && window.TREE_COLOURS.length > 0) { palette = window.TREE_COLOURS; }
    else {
      try {
        var s = localStorage.getItem('treeColoursV1');
        if (s) { palette = JSON.parse(s); }
      } catch (e) {}
    }

    var map;
    if (markers.length === 1) {
      map = L.map('map').setView([markers[0].lat, markers[0].lng], 12);
    } else {
      map = L.map('map').fitBounds(markers.map(function(c){ return [c.lat, c.lng]; }));
    }

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    function buildTreeMarker(c) {
      var info = recordToInfo(byId[c.id], c.id);
      var fill = typeColor[info.type] < palette.length ? palette[typeColor[info.type]] : '#DC2626';
      var icon = L.divIcon({
        className: 'tree-pin',
        html: '<svg width="26" height="34" viewBox="0 0 24 32" fill="none"><path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.4 18.6 0 12 0z" fill="' + fill + '" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>',
        iconSize: [26, 34],
        iconAnchor: [13, 32],
        popupAnchor: [0, -30]
      });
      var marker = L.marker([c.lat, c.lng], { icon: icon });
      marker.bindPopup('<div class="giw">' + treeCardHtml(info, c.lat, c.lng) + '</div>');
      return marker;
    }

    var rendered = {};

    function updateVisibleMarkers() {
      var bounds = map.getBounds();
      var inBounds = {};
      markers.forEach(function(c, idx) {
        if (bounds.contains([c.lat, c.lng])) {
          inBounds[idx] = c;
        }
      });

      var keys = Object.keys(rendered);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (!inBounds[k]) {
          map.removeLayer(rendered[k]);
          delete rendered[k];
        }
      }

      markers.forEach(function(c, idx) {
        if (inBounds[idx] && !rendered[idx]) {
          rendered[idx] = buildTreeMarker(c).addTo(map);
        }
      });
    }

    map.on('moveend zoomend', updateVisibleMarkers);
    updateVisibleMarkers();
  }

  function treeCardHtml(info, lat, lng) {
    return '' +
      '<div class="map-card">' +
        '<div class="map-photo"><span class="map-emoji">' + info.emoji + '</span>' +
          (info.health ? '<span class="map-health health-' + String(info.health).toLowerCase().replace(/\s+/g, '-') + '">' + info.health + '</span>' : '') +
        '</div>' +
        '<div class="map-info">' +
          '<div class="map-name">' + (info.localName || info.type) + '</div>' +
          (info.treeId ? '<div class="map-id">' + info.treeId + '</div>' : '') +
          '<div class="map-coords">' + lat.toFixed(4) + ', ' + lng.toFixed(4) + '</div>' +
          (info.address ? '<div class="map-addr">' + info.address + '</div>' : '') +
          (info.caregiver ? '<div class="map-cg">Caregiver: ' + info.caregiver + '</div>' : '') +
          (info.careGiverContact ? '<div class="map-cg">📞 ' + info.careGiverContact + '</div>' : '') +
          '<div class="map-cg">&nbsp;</div>' +
          '<div class="map-stats">📏 ' + (info.height || '—') + ' · 📐 ' + (info.diameter || '—') + '</div>' +
        '</div>' +
      '</div>';
  }

  initMap();
