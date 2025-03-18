import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts';
import Papa from 'papaparse';

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium ${active 
      ? 'bg-blue-500 text-white' 
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    style={{ 
      padding: '8px 16px', 
      fontWeight: 500, 
      backgroundColor: active ? '#3b82f6' : '#e5e7eb',
      color: active ? 'white' : '#374151',
      border: 'none',
      borderRadius: '4px',
      marginRight: '8px',
      cursor: 'pointer'
    }}
  >
    {children}
  </button>
);

const WeatherVisualization = ({ initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyData, setMonthlyData] = useState({});
  const [yearlyData, setYearlyData] = useState([]);
  const [decadeData, setDecadeData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2020);
  const [yearRange, setYearRange] = useState({ min: 1950, max: 2021 });
  const [allYearAverage, setAllYearAverage] = useState([]);
  const [firstWarmYear, setFirstWarmYear] = useState(null);
  
  // Update active tab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  useEffect(() => {
    const processData = async () => {
      try {
        setLoading(true);
        // Use fetch API instead of window.fs for browser compatibility
        const response = await fetch('/weather.csv');
        const fileContent = await response.text();
        
        const parsedData = Papa.parse(fileContent, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        
        // Process the data for both tabs
        const processedData = parsedData.data.map(row => {
          if (!row.time || !row.Ktemp) return null; // Skip incomplete rows
          
          const date = new Date(row.time);
          const year = date.getFullYear();
          const month = date.getMonth(); // 0-11
          const fTemp = (row.Ktemp - 273.15) * (9/5) + 32;
          
          return {
            ...row,
            date,
            year,
            month,
            fTemp
          };
        }).filter(row => row !== null); // Remove null entries
        
        // --- Process data for monthly tab ---
        // Calculate monthly averages by year
        const monthlyAveragesByYear = {};
        processedData.forEach(row => {
          if (!monthlyAveragesByYear[row.year]) {
            monthlyAveragesByYear[row.year] = Array(12).fill(0).map(() => ({ sum: 0, count: 0 }));
          }
          
          monthlyAveragesByYear[row.year][row.month].sum += row.fTemp;
          monthlyAveragesByYear[row.year][row.month].count += 1;
        });
        
        // Calculate averages and format data for recharts
        const years = Object.keys(monthlyAveragesByYear).sort();
        setYearRange({
          min: parseInt(years[0]),
          max: parseInt(years[years.length - 1])
        });
        
        // Format monthly data by year
        const formattedDataByYear = {};
        years.forEach(year => {
          formattedDataByYear[year] = Array(12).fill(0).map((_, i) => {
            const { sum, count } = monthlyAveragesByYear[year][i];
            return {
              month: i,
              monthName: new Date(0, i).toLocaleString('default', { month: 'short' }),
              temp: count > 0 ? sum / count : null
            };
          });
        });
        
        setMonthlyData(formattedDataByYear);
        
        // Calculate all-time average for each month
        const allTimeAvg = Array(12).fill(0).map(() => ({ sum: 0, count: 0 }));
        
        years.forEach(year => {
          for (let month = 0; month < 12; month++) {
            const { sum, count } = monthlyAveragesByYear[year][month];
            if (count > 0) {
              allTimeAvg[month].sum += sum;
              allTimeAvg[month].count += count;
            }
          }
        });
        
        const allYearAvgFormatted = allTimeAvg.map((data, i) => ({
          month: i,
          monthName: new Date(0, i).toLocaleString('default', { month: 'short' }),
          temp: data.count > 0 ? data.sum / data.count : null
        }));
        
        setAllYearAverage(allYearAvgFormatted);
        setSelectedYear(parseInt(years[years.length - 1])); // Default to most recent year
        
        // --- Process data for yearly tab ---
        // Calculate yearly averages
        const yearlyAverages = {};
        processedData.forEach(row => {
          if (!yearlyAverages[row.year]) {
            yearlyAverages[row.year] = {
              sum: 0,
              count: 0
            };
          }
          
          yearlyAverages[row.year].sum += row.fTemp;
          yearlyAverages[row.year].count += 1;
        });
        
        // Find when yearly average first exceeds 55°F
        const yearlyAvgData = [];
        let firstYearAbove55 = null;
        
        Object.keys(yearlyAverages).sort().forEach(year => {
          const { sum, count } = yearlyAverages[year];
          const avgTemp = sum / count;
          
          yearlyAvgData.push({
            year: parseInt(year),
            avgTemp,
            isAbove55: avgTemp > 55
          });
          
          // Check if this is the first year exceeding 55°F
          if (avgTemp > 55 && firstYearAbove55 === null) {
            firstYearAbove55 = parseInt(year);
          }
        });
        
        setYearlyData(yearlyAvgData);
        setFirstWarmYear(firstYearAbove55);
        
        // Calculate decade averages
        const decadeAverages = {};
        yearlyAvgData.forEach(item => {
          const decade = Math.floor(item.year / 10) * 10;
          if (!decadeAverages[decade]) {
            decadeAverages[decade] = {
              sum: 0,
              count: 0
            };
          }
          
          decadeAverages[decade].sum += item.avgTemp;
          decadeAverages[decade].count += 1;
        });
        
        const decadeAvgData = Object.keys(decadeAverages).map(decade => {
          const { sum, count } = decadeAverages[decade];
          const avgTemp = sum / count;
          return {
            decade: parseInt(decade),
            avgTemp,
            isAbove55: avgTemp > 55,
            label: `${decade}s`
          };
        }).sort((a, b) => a.decade - b.decade);
        
        setDecadeData(decadeAvgData);
        setLoading(false);
      } catch (err) {
        console.error('Error processing data:', err);
        setError(`Failed to load weather data: ${err.message}`);
        setLoading(false);
      }
    };
    
    processData();
  }, []);
  
  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '64px' }}>Loading weather data...</div>;
  }
  
  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }
  
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <TabButton 
          active={activeTab === 'monthly'} 
          onClick={() => setActiveTab('monthly')}
        >
          Monthly Temperatures
        </TabButton>
        <TabButton 
          active={activeTab === 'yearly'} 
          onClick={() => setActiveTab('yearly')}
        >
          Yearly Analysis
        </TabButton>
      </div>
      
      {activeTab === 'monthly' && (
        <>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Monthly Average Temperatures</h2>
            <p style={{ marginBottom: '16px', color: '#555' }}>
              This visualization shows the average temperature (°F) for each month of the year. 
              Use the slider to view data for a specific year, or compare with the 72-year average.
            </p>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Year: {selectedYear}</span>
                <span>72-Year Average (1950-2021)</span>
              </div>
              <input
                type="range"
                min={yearRange.min}
                max={yearRange.max}
                value={selectedYear}
                onChange={handleYearChange}
                style={{ width: '100%' }}
              />
            </div>
          </div>
          
          <div style={{ height: '384px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="monthName" 
                  type="category"
                  allowDuplicatedCategory={false}
                  domain={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                  data={allYearAverage}
                />
                <YAxis 
                  label={{ value: 'Temperature (°F)', angle: -90, position: 'insideLeft' }} 
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  formatter={(value) => [value.toFixed(1) + '°F']} 
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Line 
                  name={`${selectedYear} Temperature`} 
                  data={monthlyData[selectedYear] || []} 
                  dataKey="temp" 
                  stroke="#8884d8" 
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 8 }}
                  isAnimationActive={true}
                />
                <Line 
                  name="72-Year Average" 
                  data={allYearAverage} 
                  dataKey="temp" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
      
      {activeTab === 'yearly' && (
        <>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Yearly Average Temperatures</h2>
            <p style={{ marginBottom: '16px', color: '#555' }}>
              Analysis of when Cornell Tech's average yearly temperature first exceeded 55°F.
              The first year with an average temperature above 55°F was <strong>{firstWarmYear}</strong>.
            </p>
          </div>
          
          <div style={{ height: '384px', marginBottom: '32px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={yearlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickCount={10}
                />
                <YAxis 
                  label={{ value: 'Average Temperature (°F)', angle: -90, position: 'insideLeft' }}
                  domain={[50, 60]}
                />
                <Tooltip 
                  formatter={(value) => [value.toFixed(2) + '°F']}
                  labelFormatter={(year) => `Year: ${year}`}
                />
                <Legend />
                <ReferenceLine y={55} stroke="red" strokeDasharray="3 3" label="55°F Threshold" />
                <Line 
                  name="Yearly Average Temperature" 
                  dataKey="avgTemp" 
                  stroke="#8884d8" 
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    return payload.isAbove55 ? (
                      <circle cx={cx} cy={cy} r={5} fill="red" />
                    ) : (
                      <circle cx={cx} cy={cy} r={4} fill="#8884d8" />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Temperature Trend by Decade</h3>
          </div>
          
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={decadeData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis 
                  domain={[50, 60]}
                  label={{ value: 'Average Temperature (°F)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [value.toFixed(2) + '°F']}
                  labelFormatter={(decade) => `${decade}`}
                />
                <Legend />
                <ReferenceLine y={55} stroke="red" strokeDasharray="3 3" label="55°F Threshold" />
                <Bar 
                  dataKey="avgTemp" 
                  name="Decade Average" 
                  fill={(data) => data.isAbove55 ? '#ff6b6b' : '#8884d8'}
                  fillOpacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Findings</h3>
            <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
              <li style={{ marginBottom: '4px' }}>
                <strong>First warm year:</strong> {firstWarmYear} was the first year with an annual average temperature above 55°F
              </li>
              <li style={{ marginBottom: '4px' }}>
                <strong>Recent warming trend:</strong> Since 1990, average temperatures have been trending upward
              </li>
              <li style={{ marginBottom: '4px' }}>
                <strong>Warmest decades:</strong> The 2010s and 2020s show the highest average temperatures in the dataset
              </li>
              <li style={{ marginBottom: '4px' }}>
                <strong>Consistency:</strong> Years exceeding 55°F were rare before 1990, but have become more common in recent decades
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default WeatherVisualization;