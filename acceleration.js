const [speedEl, latEl, longEl, distanceEl, errorEl] = document.getElementsByTagName('p');
const isInstantaneousEl = document.getElementById('instVel');
const [restartEl] = document.getElementsByTagName('button');

function initialize() {
  let prevPosition;
  let initialPosition;
  let initialTime;
  let prevTime;

  let watchId;

  isInstantaneousEl.addEventListener('click', e => {
    if (!e.target.checked) {
      initialPosition = prevPosition;
      initialTime = prevTime;
      restartEl.disabled = false;
    } else restartEl.disabled = true;
  });

  return {
    start() {
      watchId = navigator.geolocation.watchPosition(
        ({coords: {latitude, longitude}, timestamp}) => {
          if (!prevPosition || !initialPosition) {
            initialPosition = [latitude, longitude];
            initialTime = timestamp;
            prevPosition = [latitude, longitude];
            prevTime = timestamp;

            setTagsInfo(latitude, longitude);
            return;
          }

          if (latitude === prevPosition[0] && longitude === prevPosition[1]) return;

          const {time, distance} = getTimeAndDistance(
            latitude,
            longitude,
            timestamp,
            isInstantaneousEl.checked ? prevPosition : initialPosition,
            isInstantaneousEl.checked ? prevTime : initialTime,
          );

          setTagsInfo(latitude, longitude, distance / 1000 / time, distance);

          prevPosition = [latitude, longitude];
          prevTime = timestamp;
        },
        onError,
        {enableHighAccuracy: true},
      );
    },
    stop() {
      navigator.geolocation.clearWatch(watchId);
      initialPosition = undefined;
      prevPosition = undefined;
    },
  };
}

if (!navigator.geolocation) {
  speedEl.textContent = 'Geolocation is not supported by your browser';
} else {
  const {start, stop} = initialize();
  start();
  restartEl.addEventListener('click', () => {
    stop();
    start();
  });
}

function getTimeAndDistance(latitude, longitude, timestamp, refPosition, refTime) {
  return {
    distance: distanceBetweenEarthCoordinates(...refPosition, latitude, longitude),
    time: (timestamp - refTime) / 1000 / 60 / 60,
  };
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

const earthRadiusInMeters = 6371000;
function distanceBetweenEarthCoordinates(lat1, lon1, lat2, lon2) {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  lat1 = degreesToRadians(lat1);
  lat2 = degreesToRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusInMeters * c;
}

function onError(e) {
  errorEl.textContent = e.message;
  alert('Location access is needed');
}

function setTagsInfo(lat, long, speed, distance) {
  latEl.textContent = `Latitude: ${lat}°`;
  longEl.textContent = `Longitude: ${long}°`;
  if (!speed || !distance) return;
  speedEl.textContent = speed.toFixed(1);
  distanceEl.textContent = `Distance traveled: ${distance.toFixed(1)}m`;
}
