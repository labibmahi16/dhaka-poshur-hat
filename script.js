// ===============================
// MAP SETUP
// ===============================

const map = L.map("map").setView([23.8103, 90.4125], 11);

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution: "&copy; OpenStreetMap contributors",
  }
).addTo(map);

// ===============================
// GLOBAL VARIABLES
// ===============================

let userLat = null;
let userLng = null;

let userMarker = null;

let routeControl = null;

let hatsData = [];

// ===============================
// GOOGLE SHEET CSV URL
// ===============================

const SHEET_URL =
  "PASTE_YOUR_GOOGLE_SHEET_CSV_LINK_HERE";

// ===============================
// CUSTOM ICONS
// ===============================

// RED USER PIN

const userIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",

  iconSize: [25, 41],

  iconAnchor: [12, 41],

  popupAnchor: [1, -34],

  shadowSize: [41, 41],
});

// GREEN HAT PIN

const hatIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",

  iconSize: [25, 41],

  iconAnchor: [12, 41],

  popupAnchor: [1, -34],

  shadowSize: [41, 41],
});

// ===============================
// FETCH HATS DATA
// ===============================

async function loadHatData() {
  try {
    const response = await fetch(SHEET_URL);

    const csvText = await response.text();

    const rows = csvText.split("\n").slice(1);

    hatsData = rows
      .map((row) => {
        const cols = row.split(",");

        return {
          name: cols[0]?.trim(),

          lat: parseFloat(cols[1]),

          lng: parseFloat(cols[2]),

          location: cols[3]?.trim(),

          details: cols[4]?.trim(),
        };
      })
      .filter(
        (hat) =>
          hat.name &&
          !isNaN(hat.lat) &&
          !isNaN(hat.lng)
      );

    // ALL HATS ON MAP

    hatsData.forEach((hat) => {
      const marker = L.marker(
        [hat.lat, hat.lng],
        { icon: hatIcon }
      ).addTo(map);

      marker.bindPopup(`
        <b>${hat.name}</b><br>
        ${hat.location || ""}<br><br>
        ${hat.details || ""}
      `);
    });

  } catch (error) {
    console.error(error);

    alert("Failed to load hat data.");
  }
}

loadHatData();

// ===============================
// FIND NEARBY HATS
// ===============================

document
  .getElementById("findNearbyBtn")
  .addEventListener("click", () => {

    document.getElementById(
      "loadingOverlay"
    ).style.display = "flex";

    navigator.geolocation.getCurrentPosition(

      (position) => {

        userLat = position.coords.latitude;

        userLng = position.coords.longitude;

        // REMOVE OLD USER MARKER

        if (userMarker) {
          map.removeLayer(userMarker);
        }

        // ADD NEW USER MARKER

        userMarker = L.marker(
          [userLat, userLng],
          { icon: userIcon }
        ).addTo(map);

        userMarker.bindPopup(
          "📍 Your Location"
        );

        map.setView([userLat, userLng], 13);

        // FIND NEARBY HATS

        const nearbyHats = hatsData
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
            (hat) => hat.distance <= 5
          )

          .sort(
            (a, b) =>
              a.distance - b.distance
          );

        // UPDATE PANEL

        const nearbyList =
          document.getElementById(
            "nearbyList"
          );

        nearbyList.innerHTML = "";

        if (nearbyHats.length === 0) {

          nearbyList.innerHTML =
            "<p>No nearby hats found within 5 km.</p>";

        } else {

          nearbyHats.forEach((hat) => {

            const googleMapsUrl =
              `https://www.google.com/maps/dir/?api=1&destination=${hat.lat},${hat.lng}`;

            nearbyList.innerHTML += `

              <div class="hat-card">

                <h4>${hat.name}</h4>

                <p>
                  ${hat.distance.toFixed(2)} km away
                </p>

                <small>
                  Tap below to show route
                </small>

                <br><br>

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

        document.getElementById(
          "nearbyTitle"
        ).innerText =
          `Nearby Hats (${nearbyHats.length})`;

        document.getElementById(
          "loadingOverlay"
        ).style.display = "none";
      },

      (error) => {

        console.error(error);

        alert(
          "Unable to access location."
        );

        document.getElementById(
          "loadingOverlay"
        ).style.display = "none";
      }
    );
  });

// ===============================
// SHOW ROUTE
// ===============================

function showRoute(lat, lng) {

  if (!userLat || !userLng) {

    alert(
      "Please click Find Nearby Hats first."
    );

    return;
  }

  // REMOVE OLD ROUTE

  if (routeControl) {
    map.removeControl(routeControl);
  }

  routeControl = L.Routing.control({

    waypoints: [

      L.latLng(userLat, userLng),

      L.latLng(lat, lng),
    ],

    routeWhileDragging: false,

    addWaypoints: false,

    draggableWaypoints: false,

    fitSelectedRoutes: true,

    show: false,

  }).addTo(map);
}

// ===============================
// DISTANCE CALCULATION
// ===============================

function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {

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

// ===============================
// RECENTER BUTTON
// ===============================

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

// ===============================
// PANEL TOGGLE
// ===============================

const toggleBtn =
  document.getElementById(
    "togglePanelBtn"
  );

const nearbyPanel =
  document.getElementById(
    "nearbyPanel"
  );

const nearbyList =
  document.getElementById(
    "nearbyList"
  );

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

// ===============================
// CLOSE PANEL WHEN CLICKING OUTSIDE
// ===============================

document.addEventListener("click", (e) => {

  const clickedInside =
    nearbyPanel.contains(e.target);

  if (
    !clickedInside &&
    !minimized
  ) {

    nearbyList.style.display = "none";

    toggleBtn.textContent = "+";

    minimized = true;
  }
});
