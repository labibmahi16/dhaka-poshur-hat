const SHEET_URL =
      return null;
    },

  }).addTo(map);
}

// Distance Calculation

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
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Recenter Button

document.getElementById("recenterBtn")
  .addEventListener("click", () => {

    if (userLat && userLng) {
      map.setView([userLat, userLng], 13);
    }
  });

// Panel Toggle

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
