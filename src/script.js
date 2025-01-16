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
            url = `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('City not found');
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// Get 5-day forecast data
async function getForecastData(coords) {
    try {
        const url = `${BASE_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error('Failed to fetch forecast data');
        }

        // Process and filter forecast data
        const processedData = data.list.filter((item, index) => index % 8 === 0);
        return processedData;
    } catch (error) {
        console.error('Error fetching forecast:', error);
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

let isCelsius = true;

// Format temperature with unit
function formatTemperature(temp) {
    if (isCelsius) {
        return `${Math.round(temp)}°C`;
    }
    return `${Math.round((temp * 9/5) + 32)}°F`;
}

// Display weather data
async function updateWeatherData(data, animate = false) {
    const weatherData = document.getElementById('weatherData');
    const weatherIcon = getWeatherIcon(data.weather[0].icon);
    
    // Store the original data for unit conversion
    weatherData.dataset.temp = JSON.stringify(data);
    
    // Create new content
    const newContent = `
        <div class="weather-card">
            <h2 class="text-3xl font-bold mb-2">${data.name}</h2>
            <div class="text-6xl font-bold mb-4">
                <i class="${weatherIcon} text-yellow-300"></i>
            </div>
            <div class="text-5xl font-bold mb-4">${formatTemperature(data.main.temp)}</div>
            <div class="text-xl mb-4 capitalize">${data.weather[0].description}</div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-lg">
                <div class="detail-box">
                    <i class="fa-solid fa-temperature-half text-yellow-300"></i>
                    <div>Feels like</div>
                    <div>${formatTemperature(data.main.feels_like)}</div>
                </div>
                <div class="detail-box">
                    <i class="fa-solid fa-droplet text-blue-300"></i>
                    <div>Humidity</div>
                    <div>${data.main.humidity}%</div>
                </div>
                <div class="detail-box">
                    <i class="fa-solid fa-wind text-gray-300"></i>
                    <div>Wind Speed</div>
                    <div>${data.wind.speed} m/s</div>
                </div>
                <div class="detail-box">
                    <i class="fa-solid fa-gauge-high text-purple-300"></i>
                    <div>Pressure</div>
                    <div>${data.main.pressure} hPa</div>
                </div>
            </div>
        </div>
    `;

    weatherData.innerHTML = newContent;
    const card = weatherData.querySelector('.weather-card');
    
    if (animate) {
        card.classList.add('bounce-in');
    }
}

// Display forecast data
function updateForecastData(forecastData) {
    const forecastContainer = document.getElementById('forecastData');
    const forecastSection = document.getElementById('forecast');
    
    if (!forecastData || !Array.isArray(forecastData) || forecastData.length === 0) {
        forecastSection.classList.add('hidden');
        return;
    }
    
    // Store the original data for unit conversion
    forecastContainer.dataset.forecast = JSON.stringify(forecastData);
    
    forecastContainer.innerHTML = '';

    forecastData.forEach((data, index) => {
        if (!data || !data.dt || !data.weather || !data.weather[0] || !data.main) {
            console.warn('Invalid forecast data entry:', data);
            return;
        }

        const date = new Date(data.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const weatherIcon = getWeatherIcon(data.weather[0].icon);
        const description = data.weather[0].description;
        
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center transform transition-all duration-300';
        forecastCard.style.animationDelay = `${index * 0.1}s`;
        
        forecastCard.innerHTML = `
            <div class="flex flex-col h-full justify-between">
                <div class="text-lg font-semibold mb-1">${dayName}</div>
                <div class="text-sm text-white/80 mb-2">${dayDate}</div>
                <div class="text-3xl mb-3 weather-icon-container">
                    <i class="${weatherIcon} text-yellow-300"></i>
                </div>
                <div class="text-sm mb-2 capitalize">${description}</div>
                <div class="space-y-1 mt-auto">
                    <div class="text-base font-medium">
                        ${formatTemperature(data.main.temp_max)}
                    </div>
                    <div class="text-sm text-white/80">
                        ${formatTemperature(data.main.temp_min)}
                    </div>
                </div>
            </div>
        `;
        
        forecastContainer.appendChild(forecastCard);
    });
    
    forecastSection.classList.remove('hidden');
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
                await updateWeatherData(weatherData, true);
                const forecastData = await getForecastData({ lat, lon });
                updateForecastData(forecastData);
            } catch (error) {
                displayError(error);
            } finally {
                setLoading(false);
            }
        });
    });
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

// Get weather icon class based on OpenWeatherMap icon code
function getWeatherIcon(iconCode) {
    const weatherIcons = {
        '01d': 'fa-sun',           // clear sky day
        '01n': 'fa-moon',          // clear sky night
        '02d': 'fa-cloud-sun',     // few clouds day
        '02n': 'fa-cloud-moon',    // few clouds night
        '03d': 'fa-cloud',         // scattered clouds day
        '03n': 'fa-cloud',         // scattered clouds night
        '04d': 'fa-cloud',         // broken clouds day
        '04n': 'fa-cloud',         // broken clouds night
        '09d': 'fa-cloud-showers-heavy', // shower rain day
        '09n': 'fa-cloud-showers-heavy', // shower rain night
        '10d': 'fa-cloud-sun-rain',      // rain day
        '10n': 'fa-cloud-moon-rain',     // rain night
        '11d': 'fa-cloud-bolt',          // thunderstorm day
        '11n': 'fa-cloud-bolt',          // thunderstorm night
        '13d': 'fa-snowflake',           // snow day
        '13n': 'fa-snowflake',           // snow night
        '50d': 'fa-smog',                // mist day
        '50n': 'fa-smog'                 // mist night
    };

    return `fa-solid ${weatherIcons[iconCode] || 'fa-question'}`;
}

// Toggle temperature unit
function toggleTemperatureUnit() {
    const weatherData = document.getElementById('weatherData');
    const forecastData = document.getElementById('forecastData');
    const unitToggle = document.getElementById('unitToggle');
    
    isCelsius = !isCelsius;
    unitToggle.textContent = isCelsius ? '°F' : '°C';
    
    if (weatherData && weatherData.dataset.temp) {
        updateWeatherData(JSON.parse(weatherData.dataset.temp), true);
    }
    
    if (forecastData && forecastData.dataset.forecast) {
        updateForecastData(JSON.parse(forecastData.dataset.forecast));
    }
}

// Initialize cursor trail
function initCursorTrail() {
    const particles = [];
    const particleCount = 25;  
    const maxParticleSize = 4;  
    const trailLifetime = 400;  
    let lastX = 0;
    let lastY = 0;
    let currentX = 0;
    let currentY = 0;
    
    class Particle {
        constructor(x, y, size = null) {
            this.x = x;
            this.y = y;
            this.originX = x;
            this.originY = y;
            this.size = size || Math.random() * maxParticleSize;
            this.createdAt = Date.now();
            this.alpha = 1;
            this.velocity = {
                x: (Math.random() - 0.5) * 0.5,
                y: (Math.random() - 0.5) * 0.5
            };
        }
        
        update() {
            const age = Date.now() - this.createdAt;
            this.alpha = 1 - (age / trailLifetime);
            
            // Smooth movement
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            
            // Particle drift effect
            const drift = Math.sin(age * 0.01) * 0.5;
            this.x += drift * this.velocity.x;
            this.y += drift * this.velocity.y;
            
            return this.alpha > 0;
        }
        
        draw(ctx) {
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size
            );
            
            const hue = (currentThemeIndex * 60 + Math.sin(Date.now() * 0.001) * 10);
            gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${this.alpha})`);
            gradient.addColorStop(1, `hsla(${hue}, 100%, 70%, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    
    // Set canvas size
    function updateCanvasSize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    const ctx = canvas.getContext('2d', { alpha: true });
    ctx.globalCompositeOperation = 'screen';
    
    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
        lastX = currentX;
        lastY = currentY;
        currentX = e.clientX;
        currentY = e.clientY;
        
        // Calculate distance moved
        const dx = currentX - lastX;
        const dy = currentY - lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Add particles along the movement path
        if (distance > 0) {
            const steps = Math.min(Math.ceil(distance / 2), 5);
            for (let i = 0; i < steps; i++) {
                const ratio = i / steps;
                const x = lastX + dx * ratio;
                const y = lastY + dy * ratio;
                const size = maxParticleSize * (1 - ratio * 0.5);
                
                particles.push(new Particle(x, y, size));
                if (particles.length > particleCount) {
                    particles.shift();
                }
            }
        }
    });
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            if (!particle.update()) {
                particles.splice(i, 1);
            } else {
                particle.draw(ctx);
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
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
    unitToggle.addEventListener('click', toggleTemperatureUnit);

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
            
            await updateWeatherData(weatherData, true);
            const forecastData = await getForecastData(coords);
            updateForecastData(forecastData);
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
                    updateWeatherData(data, true);
                    if (data.wind) {
                        getForecastData({ lat: data.coord.lat, lon: data.coord.lon })
                            .then(forecastData => updateForecastData(forecastData));
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
    
    // Initialize cursor trail
    initCursorTrail();
});
