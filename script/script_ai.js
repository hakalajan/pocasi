const WEATHER_CODES = {
  0: { label: 'Jasno', icon: '☀️' },
  1: { label: 'Polojasno', icon: '🌤️' },
  2: { label: 'Částečně oblačno', icon: '⛅' },
  3: { label: 'Zataženo', icon: '☁️' },
  45: { label: 'Mlha', icon: '🌫️' },
  48: { label: 'Krupicová mlha', icon: '🌫️' },
  51: { label: 'Lehký mrholivý déšť', icon: '🌦️' },
  53: { label: 'Mrholení', icon: '🌦️' },
  55: { label: 'Silné mrholení', icon: '🌧️' },
  56: { label: 'Lehký mrznoucí déšť', icon: '🌧️' },
  57: { label: 'Silný mrznoucí déšť', icon: '🌧️' },
  61: { label: 'Lehký déšť', icon: '🌦️' },
  63: { label: 'Déšť', icon: '🌧️' },
  65: { label: 'Silný déšť', icon: '🌧️' },
  66: { label: 'Lehký mrznoucí déšť', icon: '🌧️' },
  67: { label: 'Silný mrznoucí déšť', icon: '🌧️' },
  71: { label: 'Lehké sněžení', icon: '🌨️' },
  73: { label: 'Sněžení', icon: '❄️' },
  75: { label: 'Silné sněžení', icon: '❄️' },
  77: { label: 'Sněhové krystalky', icon: '❄️' },
  80: { label: 'Občasné přeháňky', icon: '🌦️' },
  81: { label: 'Přeháňky', icon: '🌧️' },
  82: { label: 'Silné přeháňky', icon: '🌧️' },
  85: { label: 'Lehké sněhové přeháňky', icon: '🌨️' },
  86: { label: 'Silné sněhové přeháňky', icon: '🌨️' },
  95: { label: 'Bouřka', icon: '⛈️' },
  96: { label: 'Bouřka s krupobitím', icon: '⛈️' },
  99: { label: 'Silná bouřka s krupobitím', icon: '⛈️' }
};

const quickCities = [
  'Praha',
  'Brno',
  'Ostrava',
  'Plzeň',
  'Liberec',
  'Olomouc',
  'České Budějovice',
  'Hradec Králové',
  'Ústí nad Labem',
  'Pardubice',
  'Zlín',
  'Karlovy Vary',
  'Jihlava',
];

const cityInput = document.getElementById('cityInput');
const dateInput = document.getElementById('dateInput');
const searchBtn = document.getElementById('searchBtn');
const quickCitiesWrap = document.getElementById('quickCities');
const weatherCard = document.getElementById('weatherCard');
const loading = document.getElementById('loading');

const locationName = document.getElementById('locationName');
const dateBadge = document.getElementById('dateBadge');
const weatherIcon = document.getElementById('weatherIcon');
const tempValue = document.getElementById('tempValue');
const weatherDescription = document.getElementById('weatherDescription');
const tempMin = document.getElementById('tempMin');
const tempMax = document.getElementById('tempMax');
const rainChance = document.getElementById('rainChance');
const windSpeed = document.getElementById('windSpeed');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');

function setDefaultDate() {
  const today = new Date();
  const formatted = today.toISOString().split('T')[0];
  dateInput.value = formatted;
}

function renderQuickCities() {
  quickCitiesWrap.innerHTML = quickCities
    .map((city) => `<button class="city-tag" type="button">${city}</button>`)
    .join('');

  quickCitiesWrap.querySelectorAll('.city-tag').forEach((button) => {
    button.addEventListener('click', () => {
      cityInput.value = button.textContent.trim();
      loadWeather();
    });
  });
}

function formatDateLabel(dateString) {
  const date = new Date(dateString + 'T12:00:00');
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function formatTime(dateTimeString) {
  const date = new Date(dateTimeString);
  return new Intl.DateTimeFormat('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function getWeatherMeta(code) {
  const item = WEATHER_CODES[code] || { label: 'Neznámé počasí', icon: '🌡️' };
  return item;
}

function setLoading(isLoading) {
  if (isLoading) {
    loading.classList.remove('hidden');
    weatherCard.classList.add('hidden');
  } else {
    loading.classList.add('hidden');
    weatherCard.classList.remove('hidden');
  }
}

async function fetchLocation(cityName) {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=5&language=cs&format=json`
  );

  if (!response.ok) {
    throw new Error('Nepodařilo se načíst lokaci.');
  }

  const data = await response.json();
  const results = data.results || [];

  const match = results.find((item) => item.country_code && item.country_code.toUpperCase() === 'CZ') || results[0];

  if (!match) {
    throw new Error('Město nebylo nalezeno v České republice.');
  }

  return {
    name: match.name,
    latitude: match.latitude,
    longitude: match.longitude,
    country: match.country || 'Česká republika'
  };
}

async function fetchWeather(latitude, longitude, dateString) {
  const requestDate = new Date(dateString + 'T12:00:00');
  const startDate = new Date(requestDate);
  startDate.setDate(startDate.getDate() - 2);

  const endDate = new Date(requestDate);
  endDate.setDate(endDate.getDate() + 2);

  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset&timezone=auto&start_date=${start}&end_date=${end}`
  );

  if (!response.ok) {
    throw new Error('Nepodařilo se načíst předpověď počasí.');
  }

  const data = await response.json();
  const timeArray = data.daily?.time || [];

  const targetIndex = timeArray.findIndex((item) => item === dateString);
  const index = targetIndex !== -1 ? targetIndex : 0;
  const selectedDay = {
    date: timeArray[index] || dateString,
    weatherCode: data.daily?.weather_code?.[index],
    tempMinValue: data.daily?.temperature_2m_min?.[index],
    tempMaxValue: data.daily?.temperature_2m_max?.[index],
    precipitationProbability: data.daily?.precipitation_probability_max?.[index],
    windSpeedValue: data.daily?.wind_speed_10m_max?.[index],
    sunriseValue: data.daily?.sunrise?.[index],
    sunsetValue: data.daily?.sunset?.[index]
  };

  if (selectedDay.weatherCode === undefined) {
    throw new Error('Pro zvolené datum není dostupná předpověď.');
  }

  return selectedDay;
}

function renderWeather(day, location) {
  const weatherMeta = getWeatherMeta(day.weatherCode);

  locationName.textContent = `${location.name}, ${location.country}`;
  dateBadge.textContent = formatDateLabel(day.date);
  weatherIcon.textContent = weatherMeta.icon;
  weatherDescription.textContent = weatherMeta.label;
  tempValue.textContent = `${Math.round(day.tempMaxValue)}°C`;
  tempMin.textContent = `${Math.round(day.tempMinValue)}°C`;
  tempMax.textContent = `${Math.round(day.tempMaxValue)}°C`;
  rainChance.textContent = `${Math.round(day.precipitationProbability ?? 0)}%`;
  windSpeed.textContent = `${Math.round(day.windSpeedValue ?? 0)} km/h`;
  sunrise.textContent = formatTime(day.sunriseValue);
  sunset.textContent = formatTime(day.sunsetValue);
}

async function loadWeather() {
  const city = cityInput.value.trim() || 'Praha';
  const dateValue = dateInput.value || new Date().toISOString().split('T')[0];

  setLoading(true);

  try {
    const location = await fetchLocation(city);
    const weatherDay = await fetchWeather(location.latitude, location.longitude, dateValue);
    renderWeather(weatherDay, location);
  } catch (error) {
    locationName.textContent = 'Chyba při načítání';
    dateBadge.textContent = 'Zkontrolujte zadání';
    weatherIcon.textContent = '⚠️';
    weatherDescription.textContent = error.message;
    tempValue.textContent = '--°C';
    tempMin.textContent = '--°C';
    tempMax.textContent = '--°C';
    rainChance.textContent = '--%';
    windSpeed.textContent = '-- km/h';
    sunrise.textContent = '--:--';
    sunset.textContent = '--:--';
  } finally {
    setLoading(false);
  }
}

searchBtn.addEventListener('click', loadWeather);
cityInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    loadWeather();
  }
});

dateInput.addEventListener('change', loadWeather);

setDefaultDate();
renderQuickCities();
loadWeather();
