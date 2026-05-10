// Initialize map
    const userLng = position.coords.longitude;

    // User marker
    L.marker([userLat, userLng])
      .addTo(map)
      .bindPopup('📍 You are here')
      .openPopup();

    map.setView([userLat, userLng], 13);

    // Check nearby hats
    let nearbyCount = 0;

    hats.forEach(hat => {

      const distance = calculateDistance(
        userLat,
        userLng,
        hat.lat,
        hat.lng
      );

      if (distance <= 2) {
        nearbyCount++;
      }
    });

    alert(`Found ${nearbyCount} hat(s) within 2 km radius.`);

  }, () => {
    alert('Location access denied');
  });
});

// Distance formula
function calculateDistance(lat1, lon1, lat2, lon2) {

  const R = 6371;

  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
