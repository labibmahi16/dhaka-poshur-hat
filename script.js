const map = L.map("map").setView(
  [23.8103, 90.4125],
  11
);

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution:
      "&copy; OpenStreetMap contributors",
  }
).addTo(map);

// ======================
// GOOGLE SHEET CSV
// ======================

const SHEET_URL =
  "PASTE_YOUR_CSV_LINK_HERE";

// ======================

let hatsData = [];

let userLat = null;
let userLng = null;

let userMarker = null;

let routeControl = null;

// ======================
// ICONS
// ======================

const userIcon = L.icon({

  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",

  iconSize: [25, 41],

  iconAnchor: [12, 41],
});

const hatIcon = L.icon({

  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",

  iconSize: [25, 41],

  iconAnchor: [12, 41],
});

// ======================
// LOAD DATA
// ======================

async function loadData() {

  const response =
    await fetch(SHEET_URL);

  const csv =
    await response.text();

  const rows =
    csv.split("\n").slice(1);

  hatsData = rows.map((row) => {

    const cols = row.split(",");

    return {

      name: cols[0],

      lat: parseFloat(cols[1]),

      lng: parseFloat(cols[2]),

      location: cols[3],

      details: cols[4],
    };
  });

  hatsData.forEach((hat) => {

    if (!hat.lat || !hat.lng) return;

    L.marker(
      [hat.lat, hat.lng],
      { icon: hatIcon }
    )

      .addTo(map)

      .bindPopup(`
        <b>${hat.name}</b><br>
        ${hat.location || ""}
      `);
  });
}

loadData();

// ======================
// FIND NEARBY
// ======================

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

        if (userMarker) {
          map.removeLayer(userMarker);
        }

        userMarker = L.marker(
          [userLat, userLng],
          { icon: userIcon }
        )

          .addTo(map)

          .bindPopup(
            "📍 Your Location"
          );

        map.setView(
          [userLat, userLng],
          13
        );

        const nearby =
          hatsData

            .map((hat) => {

              const distance =
                calculateDistance(
                  userLat,
                  userLng,
                  hat.lat,
                  hat.lng
                );

              return {
                ...hat,
                distance,
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

        renderNearby(nearby);

        document.getElementById(
          "loadingOverlay"
        ).style.display = "none";
      },

      () => {

        alert(
          "Location access denied."
        );

        document.getElementById(
          "loadingOverlay"
        ).style.display = "none";
      }
    );
  });

// ======================
// RENDER NEARBY
// ======================

function renderNearby(hats) {

  const nearbyList =
    document.getElementById(
      "nearbyList"
    );

  nearbyList.innerHTML = "";

  document.getElementById(
    "nearbyTitle"
  ).innerText =
    `Nearby Hats (${hats.length})`;

  hats.forEach((hat) => {

    const googleMapsUrl =
      `https://www.google.com/maps/dir/?api=1&destination=${hat.lat},${hat.lng}`;

    nearbyList.innerHTML += `

      <div class="hat-card">

        <h4>${hat.name}</h4>

        <p>
          ${hat.distance.toFixed(2)}
          km away
        </p>

        <button
          class="route-btn"
          onclick="showRoute(${hat.lat}, ${hat.lng})"
        >
          Show Route
        </button>

        <a
          href="${googleMapsUrl}"
          target="_blank"
          class="google-maps-btn"
        >
          Open Google Maps
        </a>

      </div>
    `;
  });
}

// ======================
// SHOW ROUTE
// ======================

function showRoute(lat, lng) {

  if (!userLat || !userLng) return;

  if (routeControl) {
    map.removeControl(routeControl);
  }

  routeControl =
    L.Routing.control({

      waypoints: [

        L.latLng(
          userLat,
          userLng
        ),

        L.latLng(lat, lng),
      ],

      addWaypoints: false,

      draggableWaypoints: false,

      fitSelectedRoutes: true,

      show: false,

    }).addTo(map);
}

// ======================
// DISTANCE
// ======================

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

    Math.cos(
      deg2rad(lat1)
    ) *

    Math.cos(
      deg2rad(lat2)
    ) *

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

// ======================
// RECENTER
// ======================

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

// ======================
// PANEL TOGGLE
// ======================

const toggleBtn =
  document.getElementById(
    "togglePanelBtn"
  );

const nearbyList =
  document.getElementById(
    "nearbyList"
  );

let minimized = false;

toggleBtn.addEventListener(
  "click",
  () => {

    minimized = !minimized;

    if (minimized) {

      nearbyList.style.display =
        "none";

      toggleBtn.textContent = "+";

    } else {

      nearbyList.style.display =
        "block";

      toggleBtn.textContent = "−";
    }
  }
);
