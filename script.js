// Initialize map
const map = L.map('map').setView([23.8103, 90.4125], 11);

// OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Sample hat data
const hats = [
  {
    name: "Gabtoli Poshur Hat",
    location: "Gabtoli, Dhaka",
    lat: 23.7832,
    lng: 90.3444,
    details: "One of the largest cattle markets in Dhaka."
  },
  {
    name: "Meradia Hat",
    location: "Meradia, Badda",
    lat: 23.7707,
    lng: 90.4512,
    details: "Popular local cattle market."
  },
  {
    name: "Aftabnagar Hat",
    location: "Aftabnagar",
    lat: 23.7638,
    lng: 90.4518,
    details: "Large seasonal Eid-ul-Adha cattle market."
  },
  {
    name: "Mirpur Hat",
    location: "Mirpur",
    lat: 23.8223,
    lng: 90.3654,
    details: "Nearby option for Mirpur residents."
  }
];

// Add markers
hats.forEach(hat => {
  L.marker([hat.lat, hat.lng])
    .addTo(map)
    .bindPopup(`
      <h3>${hat.name}</h3>
      <p><strong>Location:</strong> ${hat.location}</p>
      <p>${hat.details}</p>
    `);
});

// Find nearby hats button
const button = document.getElementById('findNearbyBtn');

button.addEventListener('click', () => {

  if (!navigator.geolocation) {
    alert('Geolocation not supported');
    return;
  }

  navigator.geolocation.getCurrentPosition(position => {

    const userLat = position.coords.latitude;
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