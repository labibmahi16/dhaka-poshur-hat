// Google Sheets CSV URL
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1m-eX32VwZLlZ6CWNmtfxN3Pu1kTWT_OP4nQoMMXVcpc/export?format=csv";

// Initialize map
const map = L.map("map").setView([23.8103, 90.4125], 11);

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// Fetch sheet data
fetch(SHEET_URL)
  .then((response) => response.text())
  .then((csvData) => {
    const rows = csvData.split("\n").slice(1);

    rows.forEach((row) => {
      const columns = row.split(",");

      const name = columns[0];
      const lat = parseFloat(columns[1]);
      const lng = parseFloat(columns[2]);
      const location = columns[3];
      const details = columns[4];

      // Skip invalid rows
      if (!name || isNaN(lat) || isNaN(lng)) return;

      // Add marker
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`
          <h3>${name}</h3>
          <p><strong>Location:</strong> ${location}</p>
          <p>${details}</p>
        `);
    });
  })
  .catch((error) => {
    console.error("Error loading sheet data:", error);
  });
