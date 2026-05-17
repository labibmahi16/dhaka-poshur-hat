const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1m-eX32VwZLlZ6CWNmtfxN3Pu1kTWT_OP4nQoMMXVcpc/export?format=csv";

const map =
  L.map("map").setView([23.8103, 90.4125], 11);

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution:
      "&copy; OpenStreetMap contributors",
  }
).addTo(map);

let hats = [];
let hatMarkers = [];

let userLat = null;
let userLng = null;

let currentRoute = null;
let userMarker = null;

const loadingOverlay =
  document.getElementById("loadingOverlay");

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

const greenIcon = new L.Icon({

  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const blueIcon = new L.Icon({

  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

fetch(SHEET_URL)

  .then((response) => response.text())

  .then((csvData) => {

    const rows =
      csvData.split("\n").slice(1);

    rows.forEach((row) => {

      const columns = row.split(",");

      const hat = {

        name: columns[0],

        lat: parseFloat(columns[1]),

        lng: parseFloat(columns[2]),

        location: columns[3],

        details: columns[4],

        image: columns[5] || "",

        crowd: columns[6] || "Low",
      };

      if (
        !hat.name ||
        isNaN(hat.lat) ||
        isNaN(hat.lng)
      ) return;

      hats.push(hat);

      const popupHTML = `

        <div style="width:230px;">

          ${
            hat.image
            ? `
              <img src="${hat.image}"
                   width="100%"
                   style="border-radius:12px;
                          margin-bottom:10px;
                          object-fit:cover;
                          height:130px;" />
            `
            : ""
          }

          <h3>${hat.name}</h3>

          <p>
            <strong>Area:</strong>
            ${hat.location}
          </p>

          <p>${hat.details}</p>

          <p>
            <strong>Crowd:</strong>
            ${hat.crowd}
          </p>

          <a href="https://www.google.com/maps/dir/?api=1&destination=${hat.lat},${hat.lng}"
             target="_blank"
             style="display:inline-block;
                    margin-top:10px;
                    text-decoration:none;
                    background:#16a34a;
                    color:white;
                    padding:8px 12px;
                    border-radius:8px;">

            Open in Google Maps

          </a>

        </div>
      `;

      const marker = L.marker(
        [hat.lat, hat.lng],
        {
          icon: blueIcon,
        }
      )
      .addTo(map)
      .bindPopup(popupHTML);

      hatMarkers.push({
        marker,
        hat,
      });
    });
  });

const button =
  document.getElementById("findNearbyBtn");

button.addEventListener("click", () => {

  loadingOverlay.style.display = "flex";

  navigator.geolocation.getCurrentPosition(

    (position) => {

      userLat = position.coords.latitude;
      userLng = position.coords.longitude;

      loadingOverlay.style.display = "none";

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
      .bindPopup("📍 You are here")
      .openPopup();

      map.setView([userLat, userLng], 13);

      hatMarkers.forEach((item) => {
        item.marker.setIcon(blueIcon);
      });

      let nearbyHats = [];

      hats.forEach((hat) => {

        const distance =
          calculateDistance(
            userLat,
            userLng,
            hat.lat,
            hat.lng
          );

        if (distance <= 5) {

          nearbyHats.push({
            ...hat,
            distance:
              distance.toFixed(2),
          });

          hatMarkers.forEach((item) => {

            if (
              item.hat.name === hat.name
            ) {
              item.marker.setIcon(greenIcon);
            }
          });
        }
      });

      nearbyHats.sort(
        (a, b) =>
          a.distance - b.distance
      );

      document.getElementById(
        "nearbyTitle"
      ).textContent =
        `Nearby Hats (${nearbyHats.length})`;

      const nearbyList =
        document.getElementById("nearbyList");

      nearbyList.innerHTML = "";

      nearbyHats.forEach((hat, index) => {

        let distanceClass =
          "distance-red";

        if (hat.distance <= 2) {
          distanceClass = "distance-green";
        }
        else if (hat.distance <= 4) {
          distanceClass = "distance-yellow";
        }

        let crowdClass = "crowd-low";

        if (hat.crowd === "Medium") {
          crowdClass = "crowd-medium";
        }
        else if (hat.crowd === "High") {
          crowdClass = "crowd-high";
        }

        nearbyList.innerHTML += `

          <div class="nearby-item"
               id="card-${index}"
               onclick="showRoute(${hat.lat}, ${hat.lng}, ${index})">

            <h4>${hat.name}</h4>

            <p class="${distanceClass}">
              ${hat.distance} km away
            </p>

            <p class="${crowdClass}">
              Crowd: ${hat.crowd}
            </p>

            <div class="route-text">
              Show route to this hat →
            </div>

            ${
              hat.image
              ? `
                <img src="${hat.image}" />
              `
              : ""
            }

          </div>
        `;
      });
    },

    () => {

      loadingOverlay.style.display = "none";

      alert("Location access denied");
    }
  );
});

function showRoute(lat, lng, index) {

  document
    .querySelectorAll(".nearby-item")
    .forEach((card) => {
      card.classList.remove("active");
    });

  document
    .getElementById(`card-${index}`)
    .classList.add("active");

  if (currentRoute) {
    map.removeControl(currentRoute);
  }

  currentRoute =
    L.Routing.control({

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

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

document
  .getElementById("recenterBtn")
  .addEventListener("click", () => {

    if (userLat && userLng) {
      map.setView([userLat, userLng], 13);
    }
  });

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

// Tap Outside To Close

document.addEventListener("click", (e) => {

  const panel =
    document.getElementById("nearbyPanel");

  if (
    !panel.contains(e.target)
    &&
    !e.target.closest("#findNearbyBtn")
  ) {

    nearbyList.style.display = "none";

    toggleBtn.textContent = "+";

    minimized = true;
  }
});

// Search

document
  .getElementById("searchInput")
  .addEventListener("input", (e) => {

    const search =
      e.target.value.toLowerCase();

    hatMarkers.forEach((item) => {

      const match =
        item.hat.name
          .toLowerCase()
          .includes(search)
        ||
        item.hat.location
          .toLowerCase()
          .includes(search);

      if (match) {

        item.marker.addTo(map);

      } else {

        map.removeLayer(item.marker);
      }
    });
  });
