// Trie Data Structure
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
  }

  search(prefix) {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children[char]) return [];
      node = node.children[char];
    }
    return this._collectAllWords(node, prefix.toLowerCase());
  }

  _collectAllWords(node, prefix) {
    let words = [];
    if (node.isEndOfWord) words.push(prefix);
    for (let char in node.children) {
      words = words.concat(this._collectAllWords(node.children[char], prefix + char));
    }
    return words;
  }
}

const cityTrie = new Trie();
const apiKey = "83a9cfca0a9091946ba0fdc7866fc997";
let isCelsius = true;

// Load city data
function fetchCitiesFromCSV() {
  fetch("cities.csv")
    .then(response => response.text())
    .then(csv => {
      const rows = csv.split("\n").slice(1);
      rows.forEach(row => {
        const [city] = row.split(",").map(val => val.trim());
        if (city) cityTrie.insert(city);
      });
    });
}

// Get current weather
function getWeather(cityOverride = null) {
  const city = cityOverride || document.getElementById("cityInput").value.trim();
  const errorMsg = document.getElementById("errorMsg");
  errorMsg.textContent = "";
  if (!city) {
    showError("Please enter a city name.");
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Invalid city or API issue");
      return res.json();
    })
    .then(data => {
      renderWeather(data);
      fetchForecast(city);
    })
    .catch(() => showError("Could not retrieve weather data."));
}

function showError(msg) {
  const box = document.getElementById("alertBox");
  if (!box) return;
  box.textContent = msg;
  box.classList.add("visible");
  setTimeout(() => box.classList.remove("visible"), 4000);
}

function showSuggestion(msg) {
  const box = document.getElementById("alertBox");
  if (!box) return;
  box.textContent = msg;
  box.classList.add("visible");
  setTimeout(() => box.classList.remove("visible"), 5000);
}

// Render current weather
function renderWeather(data) {
  const weatherBox = document.getElementById("weatherDetails");
  document.getElementById("location").textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById("description").textContent = data.weather[0].description;
  document.getElementById("temp").textContent = `${data.main.temp}`;
  document.getElementById("feelsLike").textContent = `${data.main.feels_like}`;
  document.getElementById("humidity").textContent = `${data.main.humidity}`;
  document.getElementById("pressure").textContent = `${data.main.pressure}`;
  document.getElementById("wind").textContent = `${data.wind.speed}`;
  document.getElementById("windDir").textContent = `${data.wind.deg}`;
  document.getElementById("clouds").textContent = `${data.clouds.all}`;
  document.getElementById("visibility").textContent = `${data.visibility}`;

  const sunrise = new Date(data.sys.sunrise * 1000);
  const sunset = new Date(data.sys.sunset * 1000);
  document.getElementById("sunrise").textContent = sunrise.toLocaleTimeString();
  document.getElementById("sunset").textContent = sunset.toLocaleTimeString();

  // Show current date and time
  const now = new Date();
  const formattedDate = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const datetimeEl = document.getElementById("datetime");
  if (datetimeEl) {
    datetimeEl.textContent = `📅 ${formattedDate}, 🕒 ${formattedTime}`;
  }

  weatherBox.classList.remove("hidden");
  document.getElementById("forecastWrapper").classList.add("hidden");

  document.querySelectorAll(".weather-card.extra").forEach(card => {
    card.classList.remove("visible");
  });

  const weatherMain = data.weather[0].main.toLowerCase();
  if (weatherMain.includes("rain")) document.body.setAttribute("data-theme", "rainy");
  else if (weatherMain.includes("snow")) document.body.setAttribute("data-theme", "snowy");
  else if (weatherMain.includes("clear")) document.body.setAttribute("data-theme", "sunny");
  else if (weatherMain.includes("storm")) document.body.setAttribute("data-theme", "stormy");
  else document.body.setAttribute("data-theme", "default");

  showSuggestion("Tip: Carry an umbrella if it looks rainy! Stay hydrated in heat.");
}

// Fetch 5-day forecast (3-hour interval data)
function fetchForecast(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
  fetch(url)
    .then(res => res.json())
    .then(data => renderForecast(data.list));
}

// Render forecast for next 6 days
function renderForecast(forecastList) {
  const container = document.getElementById("forecastCards");
  if (!container) return;
  container.innerHTML = "";
  const days = {};

  forecastList.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (!days[day]) days[day] = [];
    days[day].push(item);
  });

  Object.entries(days).slice(0, 7).forEach(([day, entries]) => {
    const noonData = entries.find(entry => entry.dt_txt.includes("12:00:00")) || entries[Math.floor(entries.length / 2)];
    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `<h4>${day}</h4><p>${noonData.weather[0].main}</p><p>${noonData.main.temp} °C</p>`;
    container.appendChild(card);
  });
}

// Toggle extra weather details
function toggleMoreData(btn) {
  const extraCards = document.querySelectorAll(".weather-card.extra");
  const forecastWrapper = document.getElementById("forecastWrapper");
  const isHidden = !extraCards[0].classList.contains("visible");
  extraCards.forEach(card => card.classList.toggle("visible"));
  if (isHidden) {
    forecastWrapper.classList.remove("hidden");
    forecastWrapper.classList.add("visible");
    btn.textContent = "🔼 Hide More";
  } else {
    forecastWrapper.classList.remove("visible");
    forecastWrapper.classList.add("hidden");
    btn.textContent = "🔽 View More";
  }
}

// Show autocomplete suggestions
function showSuggestions() {
  const input = document.getElementById("cityInput").value.toLowerCase();
  const list = document.getElementById("suggestions");
  list.innerHTML = "";
  if (!input) return;
  const matches = cityTrie.search(input);
  matches.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city.charAt(0).toUpperCase() + city.slice(1);
    li.onclick = () => {
      document.getElementById("cityInput").value = city;
      list.innerHTML = "";
    };
    list.appendChild(li);
  });
}

// Voice recognition input
function useVoiceInput() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Speech Recognition not supported in this browser.");
    return;
  }
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.start();
  recognition.onresult = function (event) {
    const spoken = event.results[0][0].transcript;
    document.getElementById("cityInput").value = spoken;
    getWeather(spoken);
  };
}

// Get weather by geolocation
function getWeatherByLocation() {
  if (!navigator.geolocation) {
    showError("Geolocation not supported.");
    return;
  }
  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        document.getElementById("cityInput").value = data.name;
        renderWeather(data);
        fetchForecast(data.name);
      });
  }, () => showError("Location access denied."));
}

// Reset everything
function resetWeather() {
  document.getElementById("cityInput").value = "";
  document.getElementById("weatherDetails").classList.add("hidden");
  document.getElementById("errorMsg").textContent = "";
  document.getElementById("suggestions").innerHTML = "";
   document.getElementById("datetime").textContent = "";
   
  const fieldsToClear = ["location", "description", "temp", "feelsLike", "humidity", "pressure", "wind", "clouds", "visibility", "sunrise", "sunset", "windDir"];
  fieldsToClear.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
  
  const forecastSection = document.getElementById("forecastCards");
  if (forecastSection) forecastSection.innerHTML = "";
  
  const forecastWrapper = document.getElementById("forecastWrapper");
  if (forecastWrapper) forecastWrapper.classList.add("hidden");

  if (forecastWrapper) forecastWrapper.innerHTML = '';
  document.querySelectorAll(".weather-card.extra").forEach(card => card.classList.remove("visible"));
  const viewMoreBtn = document.querySelector(".view-more-btn");
  if (viewMoreBtn) viewMoreBtn.textContent = "🔽 View More";
  
  document.body.setAttribute("data-theme", "default");
}

// Toggle dark/light theme
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const toggleText = document.getElementById("themeToggleText");
  toggleText.textContent = document.body.classList.contains("dark-mode") ? "🌞 Light Mode" : "🌙 Dark Mode";
}

// Switch temperature units
function toggleUnit() {
  const tempEl = document.getElementById("temp");
  const feelsLikeEl = document.getElementById("feelsLike");
  const unitLabel = document.getElementById("unitLabel");
  if (!tempEl.textContent || !feelsLikeEl.textContent) return;
  let temp = parseFloat(tempEl.textContent);
  let feels = parseFloat(feelsLikeEl.textContent);
  if (isNaN(temp) || isNaN(feels)) return;
  if (isCelsius) {
    temp = temp * 9 / 5 + 32;
    feels = feels * 9 / 5 + 32;
    unitLabel.textContent = "F";
  } else {
    temp = (temp - 32) * 5 / 9;
    feels = (feels - 32) * 5 / 9;
    unitLabel.textContent = "C";
  }
  tempEl.textContent = temp.toFixed(1);
  feelsLikeEl.textContent = feels.toFixed(1);
  isCelsius = !isCelsius;
}

// On page load
window.addEventListener("load", () => {
  fetchCitiesFromCSV();
  document.body.classList.add("dark-mode");
  document.getElementById("themeToggleText").textContent = "🌞 Light Mode";
});








