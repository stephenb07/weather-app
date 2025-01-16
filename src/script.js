const API_KEY = '6526a943a59ef9733dcf7d387023b1cc';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// State management
let currentUnit = 'metric'; // or 'imperial'
let lastCity = null;
let lastCoords = null;

// Error types for better error handling
const ErrorTypes = {
    CITY_NOT_FOUND: 'CITY_NOT_FOUND',
    NETWORK_ERROR: 'NETWORK_ERROR',
    API_ERROR: 'API_ERROR',
    EMPTY_INPUT: 'EMPTY_INPUT',
    GEOLOCATION_NOT_SUPPORTED: 'GEOLOCATION_NOT_SUPPORTED',
    GEOLOCATION_DENIED: 'GEOLOCATION_DENIED'
};

// Custom error messages for different scenarios
const ErrorMessages = {
    [ErrorTypes.CITY_NOT_FOUND]: {
        message: 'City not found. Please check the spelling and try again.',
        icon: 'fa-map-marker-alt'
    },
    [ErrorTypes.NETWORK_ERROR]: {
        message: 'Network error. Please check your internet connection and try again.',
        icon: 'fa-wifi'
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
        message: 'Geolocation is not supported by your browser.',
        icon: 'fa-map-marker-alt'
    },
    [ErrorTypes.GEOLOCATION_DENIED]: {
        message: 'You have denied access to your location.',
        icon: 'fa-map-marker-alt'
    }
};

// Fetch current weather data
async function getWeatherData(city, coords = null) {
    try {
        let url = `${BASE_URL}/weather?`;
        if (city) {
            if (!city.trim()) throw { type: ErrorTypes.EMPTY_INPUT };
            url += `q=${encodeURIComponent(city)}`;
        } else if (coords) {
            url += `lat=${coords.latitude}&lon=${coords.longitude}`;
        } else {
            throw { type: ErrorTypes.EMPTY_INPUT };
        }

        url += `&appid=${API_KEY}&units=${currentUnit}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) throw { type: ErrorTypes.CITY_NOT_FOUND };
            throw { type: ErrorTypes.API_ERROR };
        }

        const data = await response.json();
        return {
            city: data.name,
            country: data.sys.country,
            temp: Math.round(data.main.temp),
            tempF: currentUnit === 'metric' ? Math.round((data.main.temp * 9/5) + 32) : data.main.temp,
            feelsLike: Math.round(data.main.feels_like),
            feelsLikeF: currentUnit === 'metric' ? Math.round((data.main.feels_like * 9/5) + 32) : data.main.feels_like,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            description: data.weather[0].description,
            main: data.weather[0].main,
            icon: data.weather[0].icon,
            coords: { latitude: data.coord.lat, longitude: data.coord.lon }
        };
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw { type: ErrorTypes.NETWORK_ERROR };
        }
        throw error;
    }
}

// Fetch 5-day forecast
async function getForecastData(coords) {
    try {
        const response = await fetch(
            `${BASE_URL}/forecast?lat=${coords.latitude}&lon=${coords.longitude}&appid=${API_KEY}&units=${currentUnit}`
        );

        if (!response.ok) throw { type: ErrorTypes.API_ERROR };

        const data = await response.json();
        return processForecastData(data.list);
    } catch (error) {
        console.error('Forecast Error:', error);
        return null;
    }
}

// Process forecast data to get daily forecasts
function processForecastData(forecastList) {
    const dailyForecasts = {};
    
    forecastList.forEach(forecast => {
        const date = new Date(forecast.dt * 1000).toLocaleDateString();
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = {
                date: date,
                temp: forecast.main.temp,
                icon: forecast.weather[0].icon,
                description: forecast.weather[0].description,
                main: forecast.weather[0].main
            };
        }
    });

    return Object.values(dailyForecasts).slice(1, 6); // Next 5 days
}

// Display forecast data
function displayForecast(forecastData) {
    if (!forecastData) return;

    forecast.classList.remove('hidden');
    forecastData.innerHTML = forecastData.map(day => `
        <div class="bg-white/10 p-4 rounded-lg hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1">
            <div class="text-center">
                <p class="text-sm text-white/80">${new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                <i class="${getWeatherIconClass(day.icon)} text-3xl my-2 text-blue-200"></i>
                <p class="text-lg font-bold text-white">${Math.round(day.temp)}°${currentUnit === 'metric' ? 'C' : 'F'}</p>
                <p class="text-sm text-white/80 capitalize">${day.description}</p>
            </div>
        </div>
    `).join('');
}

// Get user's location
async function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject({ type: ErrorTypes.GEOLOCATION_NOT_SUPPORTED });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => resolve(position.coords),
            () => reject({ type: ErrorTypes.GEOLOCATION_DENIED })
        );
    });
}

// Toggle temperature unit
function toggleUnit() {
    currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
    unitToggle.querySelector('span').textContent = currentUnit === 'metric' ? '°C' : '°F';
    
    if (lastCity || lastCoords) {
        refreshWeather();
    }
}

// Refresh weather data with current settings
async function refreshWeather() {
    setLoading(true);
    try {
        const weatherData = await getWeatherData(lastCity, lastCoords);
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
}

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchButton = document.getElementById('searchButton');
const weatherData = document.getElementById('weatherData');
const locationButton = document.getElementById('locationButton');
const unitToggle = document.getElementById('unitToggle');
const forecast = document.getElementById('forecast');
const forecastData = document.getElementById('forecastData');

// Input validation
function validateInput(input) {
    // Remove extra spaces and special characters
    return input.trim().replace(/[^\w\s-]/gi, '');
}

// Add loading spinner
function setLoading(isLoading) {
    if (isLoading) {
        weatherData.innerHTML = `
            <div class="flex justify-center items-center space-x-3 animate-bounce-in">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span class="text-lg animate-pulse">Loading weather data...</span>
            </div>
        `;
        searchButton.disabled = true;
        searchButton.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        searchButton.disabled = false;
        searchButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// Display error message
function displayError(error) {
    const errorDetails = ErrorMessages[error.type] || ErrorMessages[ErrorTypes.API_ERROR];
    
    weatherData.innerHTML = `
        <div class="text-red-200 p-6 bg-red-500/10 rounded-lg transform transition-all duration-300
                    hover:bg-red-500/20 animate-bounce-in flex flex-col items-center">
            <i class="fas ${errorDetails.icon} text-3xl mb-3 animate-float text-red-300"></i>
            <p class="text-lg text-center animate-fade-in">${errorDetails.message}</p>
            ${error.type === ErrorTypes.CITY_NOT_FOUND ? `
                <button onclick="suggestCities()" class="mt-4 px-4 py-2 bg-red-500/30 rounded-lg hover:bg-red-500/40 transition-all duration-300">
                    <i class="fas fa-search mr-2"></i>Show Similar Cities
                </button>
            ` : ''}
        </div>
    `;
}

// Display weather data
function displayWeather(data) {
    weatherData.innerHTML = `
        <div class="space-y-6 transform transition-all duration-500 animate-bounce-in">
            <div class="text-center">
                <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 animate-slide-up">${data.city}, ${data.country}</h2>
                <div class="flex justify-center items-center animate-fade-in">
                    <i class="${getWeatherIconClass(data.icon)} text-5xl sm:text-6xl md:text-7xl mr-4 animate-float text-blue-200"></i>
                    <div class="transform transition-all duration-300 hover:scale-105">
                        <p class="text-3xl sm:text-4xl md:text-5xl font-bold transition-all hover:scale-110">
                            ${data.temp}°${currentUnit === 'metric' ? 'C' : 'F'}
                        </p>
                        <p class="text-lg sm:text-xl md:text-2xl opacity-90 transition-all group-hover:opacity-100">
                            ${data.feelsLike}°${currentUnit === 'metric' ? 'C' : 'F'}
                        </p>
                    </div>
                </div>
                <p class="capitalize text-lg sm:text-xl mt-2 font-medium animate-fade-in">${data.description}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4 bg-white/10 rounded-lg p-4 sm:p-6
                        hover:bg-white/20 transition-all duration-500 transform hover:scale-[1.02] animate-slide-up">
                <div class="text-center p-3 rounded-lg hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 group">
                    <i class="fas fa-thermometer-half text-xl sm:text-2xl mb-2 transition-transform group-hover:scale-110 text-blue-200"></i>
                    <p class="text-sm sm:text-base opacity-80 group-hover:opacity-100">Feels Like</p>
                    <p class="font-semibold text-sm sm:text-base group-hover:text-blue-200">
                        ${data.feelsLike}°${currentUnit === 'metric' ? 'C' : 'F'}
                    </p>
                </div>
                <div class="text-center p-3 rounded-lg hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 group">
                    <i class="fas fa-tint text-xl sm:text-2xl mb-2 transition-transform group-hover:scale-110 text-blue-200"></i>
                    <p class="text-sm sm:text-base opacity-80 group-hover:opacity-100">Humidity</p>
                    <p class="font-semibold text-sm sm:text-base group-hover:text-blue-200">${data.humidity}%</p>
                </div>
                <div class="text-center p-3 rounded-lg hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 group">
                    <i class="fas fa-wind text-xl sm:text-2xl mb-2 transition-transform group-hover:scale-110 text-blue-200"></i>
                    <p class="text-sm sm:text-base opacity-80 group-hover:opacity-100">Wind Speed</p>
                    <p class="font-semibold text-sm sm:text-base group-hover:text-blue-200">${data.windSpeed} m/s</p>
                </div>
                <div class="text-center p-3 rounded-lg hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 group">
                    <i class="fas fa-cloud text-xl sm:text-2xl mb-2 transition-transform group-hover:scale-110 text-blue-200"></i>
                    <p class="text-sm sm:text-base opacity-80 group-hover:opacity-100">Condition</p>
                    <p class="font-semibold text-sm sm:text-base group-hover:text-blue-200">${data.main}</p>
                </div>
            </div>
        </div>
    `;
}

// Get weather icon class based on condition and time
function getWeatherIconClass(iconCode) {
    const icons = {
        '01d': 'fas fa-sun',
        '01n': 'fas fa-moon',
        '02d': 'fas fa-cloud-sun',
        '02n': 'fas fa-cloud-moon',
        '03d': 'fas fa-cloud',
        '03n': 'fas fa-cloud',
        '04d': 'fas fa-cloud',
        '04n': 'fas fa-cloud',
        '09d': 'fas fa-cloud-showers-heavy',
        '09n': 'fas fa-cloud-showers-heavy',
        '10d': 'fas fa-cloud-rain',
        '10n': 'fas fa-cloud-rain',
        '11d': 'fas fa-bolt',
        '11n': 'fas fa-bolt',
        '13d': 'fas fa-snowflake',
        '13n': 'fas fa-snowflake',
        '50d': 'fas fa-smog',
        '50n': 'fas fa-smog'
    };
    return icons[iconCode] || 'fas fa-question';
}

// Event Listeners
searchButton.addEventListener('click', async () => {
    const cityName = validateInput(cityInput.value);
    
    if (!cityName) {
        displayError({ type: ErrorTypes.EMPTY_INPUT });
        cityInput.classList.add('border-red-500', 'animate-shake');
        setTimeout(() => cityInput.classList.remove('border-red-500', 'animate-shake'), 1000);
        return;
    }

    setLoading(true);
    try {
        lastCity = cityName;
        lastCoords = null;
        const data = await getWeatherData(cityName);
        displayWeather(data);
        
        if (data.coords) {
            const forecastData = await getForecastData(data.coords);
            displayForecast(forecastData);
        }
    } catch (error) {
        displayError(error);
    } finally {
        setLoading(false);
    }
});

locationButton.addEventListener('click', async () => {
    setLoading(true);
    try {
        const coords = await getUserLocation();
        lastCoords = coords;
        lastCity = null;
        
        const data = await getWeatherData(null, coords);
        displayWeather(data);
        
        const forecastData = await getForecastData(coords);
        displayForecast(forecastData);
    } catch (error) {
        displayError(error);
    } finally {
        setLoading(false);
    }
});

unitToggle.addEventListener('click', toggleUnit);

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchButton.click();
    }
});

cityInput.addEventListener('input', () => {
    cityInput.classList.remove('border-red-500');
});

// Add shake animation to Tailwind config
if (window.tailwind) {
    window.tailwind.config = {
        theme: {
            extend: {
                ...window.tailwind.config.theme.extend,
                keyframes: {
                    ...window.tailwind.config.theme.extend.keyframes,
                    shake: {
                        '0%, 100%': { transform: 'translateX(0)' },
                        '25%': { transform: 'translateX(-5px)' },
                        '75%': { transform: 'translateX(5px)' }
                    }
                },
                animation: {
                    ...window.tailwind.config.theme.extend.animation,
                    shake: 'shake 0.2s ease-in-out 0s 2'
                }
            }
        }
    };
}
