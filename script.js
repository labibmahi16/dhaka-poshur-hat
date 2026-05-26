const SHEET_URL =
"https://docs.google.com/spreadsheets/d/1m-eX32VwZLlZ6CWNmtfxN3Pu1kTWT_OP4nQoMMXVcpc/export?format=csv";

// MAP

const lightLayer = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution: "© OpenStreetMap contributors",
  }
);

const darkLayer = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  {
    attribution: "© OpenStreetMap contributors",
  }
);

const map = L.map("map", {
  layers: [lightLayer],
}).setView([23.8103, 90.4125], 11);

let darkMode = false;

let hats = [];

let markersLayer = L.layerGroup().addTo(map);

let userLat = null;
let userLng = null;

let userMarker = null;
let currentRoute = null;
let userCircle = null;

// ICONS

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// LOAD DATA

fetch(SHEET_URL)
  .then((response) => response.text())
  .then((csvData) => {

    const rows = csvData.split("\n").slice(1);

    rows.forEach((row) => {

      const cols = row.split(",");

      const hat = {
        name: cols[0]?.trim(),
        lat: parseFloat(cols[1]),
        lng: parseFloat(cols[2]),
        location: cols[3]?.trim() || "",
        details: cols[4]?.trim() || "",
      };

      if (!hat.name || isNaN(hat.lat) || isNaN(hat.lng)) {
        return;
      }

      hats.push(hat);
    });

    renderHatList(hats);
  })

  .catch((err) => {
    console.error(err);
    alert("Failed to load hat data.");
  });

// RENDER

function renderHatList(list) {

  markersLayer.clearLayers();

  const nearbyList =
    document.getElementById("nearbyList");

  nearbyList.innerHTML = "";

  list.forEach((hat) => {

    let distanceText = "";

    if (userLat && userLng) {

      const distance =
        calculateDistance(
          userLat,
          userLng,
          hat.lat,
          hat.lng
        );

      distanceText =
        `${distance.toFixed(2)} km away`;
    }

    nearbyList.innerHTML += `
      <div class="nearby-item"
           onclick="showRoute(${hat.lat}, ${hat.lng})">

        <h4>${hat.name}</h4>

        ${
          distanceText
            ? `<p class="distance-green">${distanceText}</p>`
            : ""
        }

        <p>${hat.location}</p>

        <div class="route-text">
          Show nearest route →
        </div>

      </div>
    `;

    L.marker(
      [hat.lat, hat.lng],
      {
        icon: greenIcon,
      }
    )

    .addTo(markersLayer)

    .bindPopup(`
      <div style="min-width:220px;">

        <h3>${hat.name}</h3>

        ${
          distanceText
            ? `<p><strong>Distance:</strong> ${distanceText}</p>`
            : ""
        }

        <p>
          <strong>Location:</strong>
          ${hat.location}
        </p>

        <br>

        <button
          onclick="showRoute(${hat.lat}, ${hat.lng})"
          style="
            width:100%;
            padding:10px;
            border:none;
            border-radius:8px;
            background:#2563eb;
            color:white;
            cursor:pointer;
            margin-bottom:8px;
          "
        >
          Show Nearest Route
        </button>

        <a
          href="https://www.google.com/maps/dir/?api=1&destination=${hat.lat},${hat.lng}"
          target="_blank"
          style="
            display:block;
            text-align:center;
            background:#16a34a;
            color:white;
            padding:10px;
            border-radius:8px;
            text-decoration:none;
          "
        >
          Open in Google Maps
        </a>

      </div>
    `);
  });
}

// FIND NEARBY

document
  .getElementById("findNearbyBtn")
  .addEventListener("click", () => {

    document.getElementById(
      "loadingOverlay"
    ).style.display = "flex";

    navigator.geolocation.getCurrentPosition(

      (position) => {

        userLat =
          position.coords.latitude;

        userLng =
          position.coords.longitude;

        document.getElementById(
          "loadingOverlay"
        ).style.display = "none";

        if (userMarker) {
          map.removeLayer(userMarker);
        }

        userMarker = L.marker(
          [userLat, userLng],
          {
            icon: redIcon,
          }
        )

        .addTo(map)

        .bindPopup("📍 You are here");

        if (userCircle) {
          map.removeLayer(userCircle);
        }

        userCircle = L.circle(
          [userLat, userLng],
          {
            radius: 5000,
            color: "#2563eb",
            fillColor: "#2563eb",
            fillOpacity: 0.08,
          }
        ).addTo(map);

        map.setView(
          [userLat, userLng],
          13
        );

        const nearby =
          hats

          .map((hat) => {

            const dist =
              calculateDistance(
                userLat,
                userLng,
                hat.lat,
                hat.lng
              );

            return {
              ...hat,
              distance: dist,
            };
          })

          .filter(
            (hat) =>
              hat.distance <= 5
          )

          .sort(
            (a, b) =>
              a.distance - b.distance
          );

        document.getElementById(
          "nearbyTitle"
        ).textContent =
          `Nearby Hats (${nearby.length})`;

        renderHatList(nearby);
      },

      () => {

        document.getElementById(
          "loadingOverlay"
        ).style.display = "none";

        alert("Location access denied.");
      }
    );
  });

// SEARCH

document
  .getElementById("searchInput")
  .addEventListener("input", (e) => {

    const value =
      e.target.value.toLowerCase();

    const filtered =
      hats.filter((hat) =>

        (hat.location || "")
          .toLowerCase()
          .includes(value)
      );

    renderHatList(filtered);
  });

// ROUTE

function showRoute(lat, lng) {

  if (!userLat || !userLng) {

    alert(
      "Click Find Nearby Hats first."
    );

    return;
  }

  if (currentRoute) {
    map.removeControl(currentRoute);
  }

  currentRoute =
    L.Routing.control({

      waypoints: [

        L.latLng(
          userLat,
          userLng
        ),

        L.latLng(
          lat,
          lng
        ),
      ],

      routeWhileDragging: false,

      addWaypoints: false,

      draggableWaypoints: false,

      fitSelectedRoutes: true,

      show: false,

      createMarker: () => null,

      lineOptions: {

        styles: [
          {
            color: "#2563eb",
            opacity: 0.8,
            weight: 6,
          },
        ],
      },

    }).addTo(map);
}

// DISTANCE

function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {

  const R = 6371;

  const dLat =
    deg2rad(lat2 - lat1);

  const dLon =
    deg2rad(lon2 - lon1);

  const a =

    Math.sin(dLat / 2) *
    Math.sin(dLat / 2) +

    Math.cos(deg2rad(lat1)) *
    Math.cos(deg2rad(lat2)) *

    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c =

    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// RECENTER

document
  .getElementById("recenterBtn")
  .addEventListener("click", () => {

    if (userLat && userLng) {

      map.setView(
        [userLat, userLng],
        13
      );
    }
  });

// DARK MODE

document
  .getElementById("darkModeBtn")
  .addEventListener("click", () => {

    darkMode = !darkMode;

    if (darkMode) {

      map.removeLayer(lightLayer);

      darkLayer.addTo(map);

    } else {

      map.removeLayer(darkLayer);

      lightLayer.addTo(map);
    }
  });

// PANEL TOGGLE

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
