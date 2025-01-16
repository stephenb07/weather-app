import axios from 'axios';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const getWeatherData = async (city) => {
	try {
		if (!API_KEY) {
			console.error('API key is missing or undefined:', import.meta.env.VITE_OPENWEATHER_API_KEY);
			throw new Error('API key is not configured');
		}

		console.log('Making request with API key:', API_KEY); // Debug log

		const response = await axios.get(`${BASE_URL}/weather`, {
			params: {
				q: city,
				appid: API_KEY.trim(), // Ensure no whitespace
				units: 'metric'
			}
		});

		const { data } = response;
		return {
			temperature: Math.round(data.main.temp),
			humidity: data.main.humidity,
			windSpeed: data.wind.speed,
			condition: data.weather[0].main,
			description: data.weather[0].description,
			icon: data.weather[0].icon,
			city: data.name,
			country: data.sys.country
		};
	} catch (error) {
		console.error('Full API Error:', error.response ? error.response.data : error);
		
		if (error.response) {
			if (error.response.status === 404) {
				throw new Error('City not found');
			} else if (error.response.status === 401) {
				throw new Error('Invalid API key - Please verify your API key at https://home.openweathermap.org/api_keys');
			}
		}
		throw new Error('Failed to fetch weather data. Please check your API key and try again.');
	}
};
