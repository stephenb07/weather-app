import './styles.css';

const API_KEY = '6526a943a59ef9733dcf7d387023b1cc';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Error types enum
const ErrorTypes = {
    NETWORK_ERROR: 'NETWORK_ERROR',
    CITY_NOT_FOUND: 'CITY_NOT_FOUND',
    API_ERROR: 'API_ERROR',
    EMPTY_INPUT: 'EMPTY_INPUT',
    GEOLOCATION_NOT_SUPPORTED: 'GEOLOCATION_NOT_SUPPORTED',
    GEOLOCATION_DENIED: 'GEOLOCATION_DENIED'
};

// Custom error messages for different scenarios
const ErrorMessages = {
    [ErrorTypes.NETWORK_ERROR]: {
        message: 'Unable to connect to weather service. Please check your internet connection.',
        icon: 'fa-wifi'
    },
    [ErrorTypes.CITY_NOT_FOUND]: {
        message: 'City not found. Please check the spelling and try again.',
        icon: 'fa-city'
    },
    [ErrorTypes.API_ERROR]: {
        message: 'Something went wrong. Please try again later.',
        icon: 'fa-exclamation-circle'
    },
    [ErrorTypes.EMPTY_INPUT]: {
        message: 'Please enter a city name.',
        icon: 'fa-keyboard'
    },
    [ErrorTypes.GEOLOCATION_NOT_SUPPORTED]: {
        message: 'Location detection is not supported by your browser.',
        icon: 'fa-map-marker-alt'
    },
    [ErrorTypes.GEOLOCATION_DENIED]: {
        message: 'You have denied access to your location.',
        icon: 'fa-map-marker-alt'
    }
};

// Weather icon mappings
const weatherIcons = {
    '01d': 'fa-sun',
    '01n': 'fa-moon',
    '02d': 'fa-cloud-sun',
    '02n': 'fa-cloud-moon',
    '03d': 'fa-cloud',
    '03n': 'fa-cloud',
    '04d': 'fa-cloud',
    '04n': 'fa-cloud',
    '09d': 'fa-cloud-showers-heavy',
    '09n': 'fa-cloud-showers-heavy',
    '10d': 'fa-cloud-sun-rain',
    '10n': 'fa-cloud-moon-rain',
    '11d': 'fa-bolt',
    '11n': 'fa-bolt',
    '13d': 'fa-snowflake',
    '13n': 'fa-snowflake',
    '50d': 'fa-smog',
    '50n': 'fa-smog'
};

// Theme definitions
const themes = [
    {
        name: 'ocean',
        label: 'Ocean Theme',
        startColor: '#0066cc',
        midColor: '#4d94ff'
    },
    {
        name: 'sunset',
        label: 'Sunset Theme',
        startColor: '#e65c00',
        midColor: '#ff8533'
    },
    {
        name: 'forest',
        label: 'Forest Theme',
        startColor: '#1a8d1a',
        midColor: '#2eb82e'
    },
    {
        name: 'aurora',
        label: 'Aurora Theme',
        startColor: '#4a148c',
        midColor: '#7b1fa2'
    }
];

let currentThemeIndex = 0;

// Apply theme function
function applyTheme(theme) {
    const appBody = document.getElementById('app-body');
    const themeToggle = document.getElementById('themeToggle');
    const themeSpan = themeToggle.querySelector('span');
    
    // Update data-theme attribute
    appBody.dataset.theme = theme.name;
    
    // Set CSS variables without interrupting the animation
    requestAnimationFrame(() => {
        appBody.style.setProperty('--gradient-start', theme.startColor);
        appBody.style.setProperty('--gradient-mid', theme.midColor);
    });
    
    // Update button text
    themeSpan.textContent = theme.label;
}

// Theme toggle handler
function toggleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    applyTheme(themes[currentThemeIndex]);
}

// Fetch current weather data
async function getWeatherData(city, coords = null) {
    try {
        let url;
        if (coords) {
            url = `${BASE_URL}/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`;
        } else {
            if (!city) throw { type: ErrorTypes.EMPTY_INPUT };
            url = `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) {
                throw { type: ErrorTypes.CITY_NOT_FOUND };
            }
            throw { type: ErrorTypes.API_ERROR };
        }

        return await response.json();
    } catch (error) {
        if (!error.type) {
            error = { type: ErrorTypes.API_ERROR };
        }
        throw error;
    }
}

// Get city coordinates
async function getCityCoordinates(city) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('Failed to get coordinates');
        }

        const data = await response.json();
        if (data.length === 0) {
            return null;
        }

        return {
            lat: data[0].lat,
            lon: data[0].lon
        };
    } catch (error) {
        console.error('Error getting coordinates:', error);
        return null;
    }
}

// Get user's location with high accuracy
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject({ type: ErrorTypes.GEOLOCATION_NOT_SUPPORTED });
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            (error) => {
                let errorType;
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorType = ErrorTypes.GEOLOCATION_DENIED;
                        break;
                    case error.TIMEOUT:
                        errorType = ErrorTypes.API_ERROR;
                        break;
                    default:
                        errorType = ErrorTypes.API_ERROR;
                }
                reject({ 
                    type: errorType,
                    details: error.message 
                });
            },
            options
        );
    });
}

// Get 5-day forecast data
async function getForecastData(coords) {
    try {
        const response = await fetch(
            `${BASE_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) throw { type: ErrorTypes.API_ERROR };
        
        const data = await response.json();
        const uniqueDays = new Map();
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for comparison
        
        // Get one forecast per day for next 5 days
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            date.setHours(0, 0, 0, 0); // Set to start of day for comparison
            const dateKey = date.toISOString().split('T')[0];
            
            // Skip if we already have this day or if it's today/past
            if (!uniqueDays.has(dateKey) && date > today) {
                // Try to get the noon forecast for each day
                const forecastDate = new Date(item.dt * 1000);
                const hour = forecastDate.getHours();
                const existingForecast = uniqueDays.get(dateKey);
                
                if (!existingForecast || Math.abs(hour - 12) < Math.abs(existingForecast.date.getHours() - 12)) {
                    uniqueDays.set(dateKey, {
                        date: forecastDate,
                        forecast: item
                    });
                }
            }
        });

        // Convert map to array and sort by date
        const forecasts = Array.from(uniqueDays.values())
            .sort((a, b) => a.date - b.date)
            .slice(0, 5)
            .map(item => item.forecast);

        return forecasts;
    } catch (error) {
        console.error('Forecast error:', error);
        throw error;
    }
}

// Get more accurate location
async function getReverseGeocode(coords) {
    try {
        // Force location to Ottawa/Greely area
        return {
            name: "Greely",
            country: "CA",
            state: "Ontario"
        };
    } catch (error) {
        console.error('Geocoding error:', error);
        throw error;
    }
}

// Get similar cities
async function getSimilarCities(searchQuery) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${searchQuery}&limit=5&appid=${API_KEY}`
        );
        
        if (!response.ok) throw new Error('Failed to fetch similar cities');
        
        const cities = await response.json();
        return cities.map(city => ({
            name: city.name,
            state: city.state,
            country: city.country,
            lat: city.lat,
            lon: city.lon
        }));
    } catch (error) {
        console.error('Error fetching similar cities:', error);
        return [];
    }
}

// Format date and time
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    }).format(date);
}

// Display weather data
function displayWeather(data) {
    const weatherData = document.getElementById('weatherData');
    if (!weatherData) return;

    const temp = data.main.temp;
    const feelsLike = data.main.feels_like;
    
    const html = `
        <div class="text-center">
            <h2 class="text-4xl font-bold mb-4">${data.name}, ${data.sys.country}</h2>
            <div class="flex flex-col items-center justify-center gap-4">
                <!-- Temperature -->
                <div class="text-6xl font-bold">
                    <span data-temp="${temp}">${Math.round(temp)}°${window.unit || 'C'}</span>
                </div>
                
                <!-- Weather Description -->
                <div class="flex items-center gap-2">
                    <i class="fas ${getWeatherIcon(data.weather[0].icon)} text-4xl text-yellow-300"></i>
                    <span class="text-xl capitalize">${data.weather[0].description}</span>
                </div>
                
                <!-- Additional Info -->
                <div class="grid grid-cols-2 gap-4 text-lg mt-4">
                    <div>
                        <i class="fas fa-temperature-low text-blue-300"></i>
                        Feels like: <span data-temp="${feelsLike}">${Math.round(feelsLike)}°${window.unit || 'C'}</span>
                    </div>
                    <div>
                        <i class="fas fa-tint text-blue-300"></i>
                        Humidity: ${data.main.humidity}%
                    </div>
                    <div>
                        <i class="fas fa-wind text-blue-300"></i>
                        Wind: ${Math.round(data.wind.speed * 3.6)} km/h
                    </div>
                    <div>
                        <i class="fas fa-compress-arrows-alt text-blue-300"></i>
                        Pressure: ${data.main.pressure} hPa
                    </div>
                </div>
            </div>
        </div>
    `;

    weatherData.innerHTML = html;
    document.getElementById('weatherCard').classList.remove('hidden');
}

// Display similar cities
function displaySimilarCities(cities) {
    const weatherData = document.getElementById('weatherData');
    if (cities.length === 0) {
        displayError({ type: ErrorTypes.CITY_NOT_FOUND });
        return;
    }

    weatherData.innerHTML = `
        <div class="weather-card text-center p-6 rounded-lg bg-white/10 backdrop-blur-sm">
            <h3 class="text-xl font-semibold mb-4">Did you mean one of these cities?</h3>
            <div class="grid gap-3">
                ${cities.map(city => `
                    <button class="similar-city-btn bg-white/5 hover:bg-white/10 p-3 rounded-lg transition-all
                                 text-left flex justify-between items-center group"
                            data-lat="${city.lat}"
                            data-lon="${city.lon}"
                            data-name="${city.name}">
                        <div>
                            <span class="font-medium">${city.name}</span>
                            <span class="text-sm text-white/70">
                                ${[city.state, city.country].filter(Boolean).join(', ')}
                            </span>
                        </div>
                        <i class="fas fa-chevron-right opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    // Add click handlers for similar city buttons
    document.querySelectorAll('.similar-city-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const lat = button.dataset.lat;
            const lon = button.dataset.lon;
            const cityName = button.dataset.name;
            
            try {
                setLoading(true);
                const weatherData = await getWeatherData(cityName, { lat, lon });
                displayWeather(weatherData);
                const forecastData = await getForecastData({ lat, lon });
                displayForecast(forecastData);
            } catch (error) {
                displayError(error);
            } finally {
                setLoading(false);
            }
        });
    });
}

// Display forecast data
function displayForecast(forecastData) {
    const forecast = document.getElementById('forecast');
    const forecastContent = document.getElementById('forecastData');
    
    if (!forecast || !forecastContent || !forecastData.length) {
        if (forecast) forecast.classList.add('hidden');
        return;
    }

    const forecastHTML = forecastData.map(day => {
        const date = new Date(day.dt * 1000);
        const minTemp = day.main.temp_min;
        const maxTemp = day.main.temp_max;
        
        return `
            <div class="forecast-card bg-white/10 backdrop-blur-sm p-3 rounded-lg text-center transform hover:scale-105 transition-transform">
                <h4 class="font-semibold mb-1">${date.toLocaleDateString('en-US', { weekday: 'short' })}</h4>
                <div class="text-sm text-white/80 mb-2">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                <i class="fas ${getWeatherIcon(day.weather[0].icon)} text-2xl mb-2 text-yellow-300"></i>
                <div class="flex flex-col gap-1 text-sm">
                    <span data-temp="${maxTemp}">High: ${Math.round(maxTemp)}°${window.unit || 'C'}</span>
                    <span data-temp="${minTemp}">Low: ${Math.round(minTemp)}°${window.unit || 'C'}</span>
                </div>
                <div class="text-sm text-white/80 mt-1">${day.weather[0].description}</div>
            </div>
        `;
    }).join('');

    forecastContent.innerHTML = forecastHTML;
    forecast.classList.remove('hidden');
}

// Display error message
function displayError(error) {
    const weatherContainer = document.getElementById('weatherData');
    const message = ErrorMessages[error.type]?.message || 'Something went wrong. Please try again later.';
    const icon = ErrorMessages[error.type]?.icon || 'fa-exclamation-circle';
    
    weatherContainer.innerHTML = `
        <div class="error-message text-center p-6 rounded-lg bg-white/10 backdrop-blur-sm">
            <i class="fas ${icon} text-4xl text-red-400 mb-4"></i>
            <p class="text-lg text-white">${message}</p>
            ${error.details ? `<p class="text-sm text-white/70 mt-2">${error.details}</p>` : ''}
        </div>
    `;
}

// Input validation
function validateInput(input) {
    return input.trim();
}

// Loading state
function setLoading(isLoading) {
    const searchButton = document.getElementById('searchButton');
    const searchIcon = searchButton.querySelector('i');
    const searchText = searchButton.querySelector('span');
    
    if (isLoading) {
        searchIcon.classList.remove('fa-search');
        searchIcon.classList.add('fa-spinner', 'animate-spin');
        searchText.textContent = 'Searching...';
        searchButton.disabled = true;
    } else {
        searchIcon.classList.add('fa-search');
        searchIcon.classList.remove('fa-spinner', 'animate-spin');
        searchText.textContent = 'Search';
        searchButton.disabled = false;
    }
}

// Handle input changes
function handleInput(e) {
    const input = e.target;
    input.classList.remove('border-red-500', 'animate-shake');
}

// Handle enter key press
function handleEnterKey(e) {
    if (e.key === 'Enter') {
        handleSearch();
    }
}

// Get appropriate weather icon
function getWeatherIcon(iconCode) {
    return weatherIcons[iconCode] || 'fas fa-question';
}

document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('cityInput');
    const searchButton = document.getElementById('searchButton');
    const weatherData = document.getElementById('weatherData');
    const locationButton = document.getElementById('locationButton');
    const unitToggle = document.getElementById('unitToggle');
    const themeToggle = document.getElementById('themeToggle');
    const forecast = document.getElementById('forecast');
    const forecastData = document.getElementById('forecastData');
    
    // Initialize theme
    applyTheme(themes[currentThemeIndex]);
    
    let isCelsius = true;
    
    // Temperature unit toggle with animation
    function toggleUnit() {
        isCelsius = !isCelsius;
        const unitSpan = unitToggle.querySelector('span');
        unitSpan.textContent = isCelsius ? '°C' : '°F';
        
        // Update all temperature displays with animation
        const tempElements = document.querySelectorAll('[data-temp]');
        tempElements.forEach(element => {
            if (element) {
                element.classList.add('animate-bounce-in');
                const celsius = parseFloat(element.dataset.temp);
                const fahrenheit = (celsius * 9/5) + 32;
                const temp = Math.round(isCelsius ? celsius : fahrenheit);
                const unit = isCelsius ? 'C' : 'F';
                
                if (element.textContent.includes('Low:')) {
                    element.textContent = `Low: ${temp}°${unit}`;
                } else if (element.textContent.includes('High:')) {
                    element.textContent = `High: ${temp}°${unit}`;
                } else if (element.textContent.includes('Feels like:')) {
                    element.textContent = `Feels like: ${temp}°${unit}`;
                } else {
                    element.textContent = `${temp}°${unit}`;
                }
                
                setTimeout(() => {
                    element.classList.remove('animate-bounce-in');
                }, 800);
            }
        });

        // Store the preference
        window.unit = isCelsius ? 'C' : 'F';
    }

    // Add temperature unit toggle event listener
    unitToggle.addEventListener('click', toggleUnit);

    // Add theme toggle event listener
    themeToggle.addEventListener('click', toggleTheme);

    // Initialize event listeners
    function initializeEventListeners() {
        searchButton.addEventListener('click', handleSearch);
        locationButton.addEventListener('click', handleLocationSearch);
        cityInput.addEventListener('keypress', handleEnterKey);
        cityInput.addEventListener('input', handleInput);
    }
    
    async function handleLocationSearch() {
        try {
            setLoading(true);
            const coords = await getUserLocation();
            
            // Get weather data
            const weatherData = await getWeatherData(null, coords);
            
            displayWeather(weatherData);
            const forecastData = await getForecastData(coords);
            displayForecast(forecastData);
        } catch (error) {
            console.error('Location error:', error);
            displayError(error);
        } finally {
            setLoading(false);
        }
    }

    function handleSearch() {
        const cityName = validateInput(cityInput.value);
        
        if (!cityName) {
            displayError({ type: ErrorTypes.EMPTY_INPUT });
            cityInput.classList.add('border-red-500', 'animate-shake');
            setTimeout(() => cityInput.classList.remove('border-red-500', 'animate-shake'), 1000);
            return;
        }

        setLoading(true);
        try {
            getWeatherData(cityName)
                .then(data => {
                    displayWeather(data);
                    if (data.wind) {
                        getForecastData({ lat: data.coord.lat, lon: data.coord.lon })
                            .then(forecastData => displayForecast(forecastData));
                    }
                })
                .catch(error => {
                    if (error.type === ErrorTypes.CITY_NOT_FOUND) {
                        getSimilarCities(cityName)
                            .then(similarCities => displaySimilarCities(similarCities));
                    } else {
                        displayError(error);
                    }
                })
                .finally(() => setLoading(false));
        } catch (error) {
            displayError(error);
        }
    }

    initializeEventListeners();

    // Add loaded class to body
    document.body.classList.add('loaded');
});
