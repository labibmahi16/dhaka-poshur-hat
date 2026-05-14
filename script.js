// Google Sheets CSV URL

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1m-eX32VwZLlZ6CWNmtfxN3Pu1kTWT_OP4nQoMMXVcpc/export?format=csv";

// Initialize map

const map = L.map("map").setView([23.8103, 90.4125], 11);

// OpenStreetMap tiles

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {

  attribution: "&copy; OpenStreetMap contributors",

}).addTo(map);

// Store hats

let hats = [];

// Store markers

let hatMarkers = [];

// User location

let userLat = null;
let userLng = null;

// Current route

let currentRoute = null;

// Red icon for user

const redIcon = new L.Icon({

  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",

  iconSize: [25, 41],

  iconAnchor: [12, 41],

  popupAnchor: [1, -34],

  shadowSize: [41, 41],
});

// Load Google Sheets data

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

      if (!hat.name || isNaN(hat.lat) || isNaN(hat.lng)) return;

      hats.push(hat);

      // Create marker

      const marker = L.marker([hat.lat, hat.lng])

        .addTo(map)

        .bindPopup(`
          <h3>${hat.name}</h3>
          <p><strong>Location:</strong> ${hat.location}</p>
          <p>${hat.details}</p>
        `);

      hatMarkers.push({
        marker,
        hat,
      });
    });
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

      userLat = position.coords.latitude;
      userLng = position.coords.longitude;

      // Red user marker

      L.marker([userLat, userLng], {
        icon: redIcon,
      })

        .addTo(map)

        .bindPopup("📍 You are here")

        .openPopup();

      map.setView([userLat, userLng], 13);

      // Remove previous glow

      hatMarkers.forEach((item) => {

        const icon = item.marker._icon;

        if (icon) {

          icon.classList.remove("nearby-glow");
        }
      });

      let nearbyHats = [];

      hats.forEach((hat) => {

        const distance = calculateDistance(
          userLat,
          userLng,
          hat.lat,
          hat.lng
        );

        if (distance <= 5) {

          nearbyHats.push({

            ...hat,

            distance: distance.toFixed(2),
          });

          // Glow nearby markers

          hatMarkers.forEach((item) => {

            if (item.hat.name === hat.name) {

              const icon = item.marker._icon;

              if (icon) {

                icon.classList.add("nearby-glow");
              }
            }
          });
        }
      });

      // Sort nearest first

      nearbyHats.sort((a, b) => a.distance - b.distance);

      // Display nearby list

      const nearbyList = document.getElementById("nearbyList");

      nearbyList.innerHTML = "";

      if (nearbyHats.length === 0) {

        nearbyList.innerHTML =
          "<p>No nearby hats found.</p>";

      } else {

        nearbyHats.forEach((hat) => {

          nearbyList.innerHTML += `

            <div class="nearby-item"
                 onclick="showRoute(${hat.lat}, ${hat.lng})">

              <h4>${hat.name}</h4>

              <p>${hat.distance} km away</p>

              <div class="route-text">
                Show route to this hat →
              </div>

            </div>
          `;
        });
      }
    },

    () => {

      alert("Location access denied");
    }
  );
});

// Show route

function showRoute(lat, lng) {

  // Remove previous route

  if (currentRoute) {

    map.removeControl(currentRoute);
  }

  currentRoute = L.Routing.control({

    waypoints: [

      L.latLng(userLat, userLng),

      L.latLng(lat, lng),
    ],

    routeWhileDragging: false,

    addWaypoints: false,

    draggableWaypoints: false,

    fitSelectedRoutes: true,

    show: false,

    lineOptions: {

      styles: [

        {
          color: "#2563eb",

          opacity: 0.7,

          weight: 6,
        },
      ],
    },

    createMarker: function () {

      return null;
    },

  }).addTo(map);
}

// Distance calculation

function calculateDistance(lat1, lon1, lat2, lon2) {

  const R = 6371;

  const dLat = deg2rad(lat2 - lat1);

  const dLon = deg2rad(lon2 - lon1);

  const a =

    Math.sin(dLat / 2) *

    Math.sin(dLat / 2) +

    Math.cos(deg2rad(lat1)) *

    Math.cos(deg2rad(lat2)) *

    Math.sin(dLon / 2) *

    Math.sin(dLon / 2);

  const c =

    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function deg2rad(deg) {

  return deg * (Math.PI / 180);
}

// Minimize / Maximize Panel

const toggleBtn =
  document.getElementById("togglePanelBtn");

const nearbyList =
  document.getElementById("nearbyList");

let minimized = false;

toggleBtn.addEventListener("click", () => {

  minimized = !minimized;

  if (minimized) {

    nearbyList.style.display = "none";

    toggleBtn.textContent = "+";

  } else {

    nearbyList.style.display = "block";

    toggleBtn.textContent = "−";
  }
});
