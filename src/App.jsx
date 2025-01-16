import { useState } from 'react'
import { getWeatherData } from './services/weatherService'

function App() {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!city.trim()) return

    setLoading(true)
    setError(null)
    
    try {
      const data = await getWeatherData(city)
      setWeather(data)
    } catch (err) {
      setError(err.message)
      setWeather(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 min-h-screen flex items-center justify-center">
      <div className="bg-white/20 backdrop-blur-lg rounded-xl p-8 w-96 shadow-2xl">
        <form onSubmit={handleSubmit} className="mb-4 flex">
          <input 
            type="text" 
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name" 
            className="flex-grow px-4 py-2 rounded-l-lg border-2 border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 transition duration-300 ease-in-out disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div className="text-white text-center">
          {loading && (
            <div className="flex justify-center items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span>Loading weather data...</span>
            </div>
          )}

          {error && (
            <div className="text-red-200 mb-4">
              <p>{error}</p>
            </div>
          )}

          {weather && !loading && (
            <div>
              <h2 className="text-2xl font-bold mb-4">{weather.name}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-4xl font-bold">{Math.round(weather.main.temp)}°C</p>
                  <p className="capitalize">{weather.weather[0].description}</p>
                </div>
                <div>
                  <p>Humidity: {weather.main.humidity}%</p>
                  <p>Wind: {weather.wind.speed} m/s</p>
                </div>
              </div>
            </div>
          )}

          {!weather && !loading && !error && (
            <p>Enter a city to see weather details</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
