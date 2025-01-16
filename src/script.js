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
            url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`;
        } else {
            url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
        }

        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw { type: ErrorTypes.CITY_NOT_FOUND };
            }
            throw { type: ErrorTypes.API_ERROR };
        }

        const data = await response.json();
        return {
            city: data.name,
            country: data.sys.country,
            temp: Math.round(data.main.temp),
            tempMin: Math.round(data.main.temp_min),
            tempMax: Math.round(data.main.temp_max),
            feels_like: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            wind: Math.round(data.wind.speed),
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            coords: {
                lat: data.coord.lat,
                lon: data.coord.lon
            }
        };
    } catch (error) {
        if (!error.type) {
            error.type = ErrorTypes.NETWORK_ERROR;
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

// Get user's location
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject({ type: ErrorTypes.GEOLOCATION_NOT_SUPPORTED });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            () => {
                reject({ type: ErrorTypes.GEOLOCATION_DENIED });
            }
        );
    });
}

// Get 5-day forecast data
async function getForecastData(coords) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) throw new Error('Failed to fetch forecast');

        const data = await response.json();
        const dailyData = {};

        // Group forecast data by day
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000).toLocaleDateString();
            if (!dailyData[date]) {
                dailyData[date] = {
                    temp_min: item.main.temp_min,
                    temp_max: item.main.temp_max,
                    icon: item.weather[0].icon,
                    description: item.weather[0].description
                };
            } else {
                dailyData[date].temp_min = Math.min(dailyData[date].temp_min, item.main.temp_min);
                dailyData[date].temp_max = Math.max(dailyData[date].temp_max, item.main.temp_max);
            }
        });

        // Convert to array and take next 5 days
        return Object.entries(dailyData)
            .slice(1, 6)
            .map(([date, data]) => ({
                date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                temp_min: Math.round(data.temp_min),
                temp_max: Math.round(data.temp_max),
                icon: data.icon,
                description: data.description
            }));
    } catch (error) {
        console.error('Error fetching forecast:', error);
        return [];
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

// Display weather data
function displayWeather(data) {
    const weatherData = document.getElementById('weatherData');
    weatherData.innerHTML = `
        <div class="weather-card text-center p-6 rounded-lg bg-white/10 backdrop-blur-sm">
            <div class="flex justify-center items-center mb-4">
                <i class="fas ${getWeatherIcon(data.icon)} text-6xl text-yellow-300 mr-4 animate-float"></i>
                <div>
                    <h2 class="text-4xl font-bold temp-transition" data-temp="${data.temp}">${data.temp}°C</h2>
                    <p class="text-lg capitalize">${data.description}</p>
                </div>
            </div>
            <h3 class="text-2xl font-semibold mb-2">${data.city}, ${data.country}</h3>
            <div class="grid grid-cols-2 gap-4 mt-4">
                <div class="bg-white/5 p-3 rounded-lg">
                    <i class="fas fa-temperature-low text-blue-300"></i>
                    <p>Min: <span class="temp-transition" data-temp="${data.tempMin}">${data.tempMin}°C</span></p>
                </div>
                <div class="bg-white/5 p-3 rounded-lg">
                    <i class="fas fa-temperature-high text-red-300"></i>
                    <p>Max: <span class="temp-transition" data-temp="${data.tempMax}">${data.tempMax}°C</span></p>
                </div>
                <div class="bg-white/5 p-3 rounded-lg">
                    <i class="fas fa-wind text-gray-300"></i>
                    <p>Wind: ${data.wind} m/s</p>
                </div>
                <div class="bg-white/5 p-3 rounded-lg">
                    <i class="fas fa-tint text-blue-300"></i>
                    <p>Humidity: ${data.humidity}%</p>
                </div>
            </div>
        </div>
    `;
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
                if (weatherData.coords) {
                    const forecastData = await getForecastData(weatherData.coords);
                    displayForecast(forecastData);
                }
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

    if (forecastData.length === 0) {
        forecast.classList.add('hidden');
        return;
    }

    forecastContent.innerHTML = forecastData.map(day => `
        <div class="forecast-card bg-white/10 backdrop-blur-sm p-3 rounded-lg text-center transform hover:scale-105 transition-transform">
            <h4 class="font-semibold mb-1 text-sm">${day.date}</h4>
            <i class="fas ${getWeatherIcon(day.icon)} text-2xl mb-1 text-yellow-300"></i>
            <p class="text-xs capitalize mb-1">${day.description}</p>
            <div class="flex justify-between text-sm">
                <span class="temp-transition" data-temp="${day.temp_min}">${day.temp_min}°C</span>
                <span class="temp-transition" data-temp="${day.temp_max}">${day.temp_max}°C</span>
            </div>
        </div>
    `).join('');

    forecast.classList.remove('hidden');
}

// Display error message
function displayError(error) {
    const weatherData = document.getElementById('weatherData');
    const errorConfig = ErrorMessages[error.type] || ErrorMessages[ErrorTypes.API_ERROR];
    
    weatherData.innerHTML = `
        <div class="text-center p-6 rounded-lg bg-red-500/10 backdrop-blur-sm animate-fade-in">
            <i class="fas ${errorConfig.icon} text-5xl text-red-400 mb-4"></i>
            <p class="text-xl text-red-100">${errorConfig.message}</p>
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
            element.classList.add('animate-bounce-in');
            const celsius = parseFloat(element.dataset.temp);
            const fahrenheit = (celsius * 9/5) + 32;
            element.textContent = isCelsius ? 
                `${Math.round(celsius)}°C` : 
                `${Math.round(fahrenheit)}°F`;
            
            // Remove animation class after it completes
            setTimeout(() => {
                element.classList.remove('animate-bounce-in');
            }, 800);
        });
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
                    if (data.coords) {
                        getForecastData(data.coords)
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

    function handleLocationSearch() {
        setLoading(true);
        getUserLocation()
            .then(coords => getWeatherData(null, coords))
            .then(data => {
                displayWeather(data);
                if (data.coords) {
                    getForecastData(data.coords)
                        .then(forecastData => displayForecast(forecastData));
                }
            })
            .catch(error => displayError(error))
            .finally(() => setLoading(false));
    }

    initializeEventListeners();

    // Add loaded class to body
    document.body.classList.add('loaded');
});
