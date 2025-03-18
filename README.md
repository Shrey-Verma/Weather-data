# Cornell Tech Weather Analysis (1950-2021)

## Overview

This project visualizes and analyzes historical weather data from Cornell Tech spanning over seven decades (1950-2021). The application provides interactive visualizations to explore temperature patterns, seasonal trends, and climate change indicators.

## Features

### Monthly Temperature Patterns
- Interactive line chart showing average temperatures for each month
- Slider to select specific years for comparison
- Comparison with 72-year average (1950-2021)

### Temperature Threshold Analysis
- Visualization of when Cornell Tech's yearly average temperature first exceeded 55°F (1953)
- Line chart showing yearly temperature trends with 55°F threshold
- Bar chart of decade averages showing warming trends

### Creative Climate Visualizations
- **Seasonal Comparison:** Radar chart comparing 1950s vs 2020s seasonal temperature anomalies
- **Seasonal Trends:** Line chart tracking all four seasons over time
- **Decade Anomalies:** Bar chart showing temperature deviations from baseline by decade and season
- **Extreme Temperature Days:** Analysis of extremely cold (<20°F) and hot (>90°F) days by decade
- **Annual Temperature Cycle:** Visualization of the daily temperature cycle throughout the year with seasonal backgrounds

## Technologies Used

- **React:** Frontend framework for building the user interface
- **Recharts:** Data visualization library for creating responsive charts
- **PapaParse:** CSV parsing library for processing the weather data

## Installation and Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shrey-Verma/Weather-data.git
   cd cornell-tech-weather
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Place data file**
   - Put `weather.csv` in the `public` folder

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open in browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
cornell-tech-weather/
├── public/
│   ├── weather.csv         # Weather data file
│   ├── favicon.ico         # App icon
│   └── index.html          # HTML template
├── src/
│   ├── components/WeatherVisualization.js  
│   ├── App.js              # Main application component
│   ├── App.css             # Main application styles
│   ├── CreativeWeatherVisualization.js  # Core visualization component
│   └── index.js            # Application entry point
├── README.md
└── package.json
```

## Key Findings

1. The first year Cornell Tech's average temperature exceeded 55°F was 1953
2. Winter temperatures have increased more dramatically than other seasons, rising over 5°F since the 1951-1980 baseline
3. Extremely cold days have become less frequent in recent decades
4. The 2010s and 2020s show the highest average temperatures in the dataset
5. All seasons show warming trends, but at different rates

## Data Source

The weather data used in this project contains daily temperature measurements near Cornell Tech from 1950 to 2021. The original data provided temperatures in Kelvin, which were converted to Fahrenheit for analysis.

## Credits

This project was created as part of a data visualization assignment for Cornell Tech.

## License

[MIT](LICENSE)
