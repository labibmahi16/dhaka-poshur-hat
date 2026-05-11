// Google Sheets CSV URL
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1m-eX32VwZLlZ6CWNmtfxN3Pu1kTWT_OP4nQoMMXVcpc/export?format=csv";

// Initialize map
const map = L.map("map").setView([23.8103, 90.4125], 11);

// OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// Store hats globally
let hats = [];

// Load data from Google Sheets
fetch(SHEET_URL)
  .then((response) => response.text())
  .then((csvData) => {
    const rows = csvData.split("\n").slice(1);

    rows.forEach((row) => {
      const columns = row.split(",");

      const hat = {
        name: columns[0],
        lat: parseFloat(columns[1]),
        lng: parseFloat(columns[2]),
        location: columns[3],
        details: columns[4],
      };

      // Skip invalid rows
      if (!hat.name || isNaN(hat.lat) || isNaN(hat.lng)) return;

      hats.push(hat);

      // Add marker
      L.marker([hat.lat, hat.lng])
        .addTo(map)
        .bindPopup(`
          <h3>${hat.name}</h3>
          <p><strong>Location:</strong> ${hat.location}</p>
          <p>${hat.details}</p>
        `);
    });
  })
  .catch((error) => {
    console.error("Error loading sheet data:", error);
  });

// Nearby button
const button = document.getElementById("findNearbyBtn");

button.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      // User marker
      L.marker([userLat, userLng])
        .addTo(map)
        .bindPopup("📍 You are here")
        .openPopup();

      map.setView([userLat, userLng], 13);

      let nearbyCount = 0;

      hats.forEach((hat) => {
        const distance = calculateDistance(
          userLat,
          userLng,
          hat.lat,
          hat.lng
        );

        if (distance <= 5) {
          nearbyCount++;
        }
      });

      alert(`Found ${nearbyCount} hat(s) within 5 km radius.`);
    },
    () => {
      alert("Location access denied");
    }
  );
});

// Distance calculation
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
