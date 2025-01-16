# WeatherVue

A modern, responsive weather application built with vanilla JavaScript and TailwindCSS. Features current weather conditions, 5-day forecast, geolocation support, and unit conversion.

## Features

- 🌡️ Current weather conditions
- 📅 5-day weather forecast
- 📍 Geolocation support
- 🔄 Unit conversion (Celsius/Fahrenheit)
- 📱 Responsive design
- ⚡ Performance optimized
- 🔧 PWA support
- 🎨 Beautiful UI with animations

## Performance Optimizations

- Resource preloading
- Service Worker for offline support
- Lazy loading of non-critical resources
- Optimized animations
- Cached DOM queries
- Debounced API calls

## Deployment

### Vercel Deployment (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

### GitHub Pages Deployment

1. Create a new repository on GitHub
2. Initialize git and push your code:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

3. Enable GitHub Pages in your repository settings

### Netlify Deployment

1. Create a new site on Netlify
2. Connect your repository
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

## Development

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file with:
```
VITE_OPENWEATHER_API_KEY=your-api-key
```

## License

MIT
