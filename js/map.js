
  function initMap() {
    var src = new URLSearchParams(location.search).get('coords') || '';

    var coords = src.split('|')
      .filter(function(p){ return p && p.indexOf(',') > -1; })
      .map(function(p){ var a = p.split(','); return { lat: parseFloat(a[0]), lng: parseFloat(a[1]), type: a.length > 2 ? decodeURIComponent(a[2]) : 'Tree' }; })
      .filter(function(c){ return !isNaN(c.lat) && !isNaN(c.lng); });

    if (!coords.length) {
      document.getElementById('map').innerHTML = '<div style="padding:40px;font-size:15px;">No coordinates provided.</div>';
      return;
    }

    var fallback = ['#DC2626'];

    var typeColor = {};
    var colorOrder = [];
    coords.forEach(function(c) {
      if (typeColor[c.type] === undefined) {
        typeColor[c.type] = colorOrder.length;
        colorOrder.push(c.type);
      }
    });

    var palette = fallback;
    if (window.TREE_COLOURS && window.TREE_COLOURS.length > 0) { palette = window.TREE_COLOURS; }
    else {
      try {
        var s = localStorage.getItem('treeColoursV1');
        if (s) { palette = JSON.parse(s); }
      } catch (e) {}
    }
    drawMap(palette);

    function drawMap(palette) {
      var map = L.map('map').fitBounds(coords.map(function(c){ return [c.lat, c.lng]; }));

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      coords.forEach(function(c) {
        var idx = typeColor[c.type];
        var fill = idx < palette.length ? palette[idx] : '#DC2626';
        var icon = L.divIcon({
          className: 'tree-pin',
          html: '<svg width="26" height="34" viewBox="0 0 24 32" fill="none"><path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.4 18.6 0 12 0z" fill="' + fill + '" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>',
          iconSize: [26, 34],
          iconAnchor: [13, 32],
          popupAnchor: [0, -30]
        });
        var marker = L.marker([c.lat, c.lng], { icon: icon }).addTo(map);
        marker.bindPopup('<div class="giw"><b>' + c.type + '</b>' + c.lat.toFixed(4) + ', ' + c.lng.toFixed(4) + '</div>');
      });
    }
  }

  initMap();
