import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceArea,
  RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, ReferenceLine
} from 'recharts';
import Papa from 'papaparse';

// Custom colors for seasons
const seasonColors = {
  winter: '#6ab4ff', 
  spring: '#95e06c', 
  summer: '#ff9a3c', 
  fall: '#c17fff'    
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }}>
        <p className="label">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value.toFixed(2)}°F`}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

const CreativeWeatherVisualization = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seasonalData, setSeasonalData] = useState([]);
  const [anomalyData, setAnomalyData] = useState([]);
  const [decadeAnomalies, setDecadeAnomalies] = useState([]);
  const [extremeData, setExtremeData] = useState([]);
  const [yearCycleData, setYearCycleData] = useState([]);
  const [activeChart, setActiveChart] = useState('seasonalRadar');
  
  useEffect(() => {
    const processData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`weather.csv`);
        const fileContent = await response.text();
        
        const parsedData = Papa.parse(fileContent, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        
        // Process the data
        const processedData = parsedData.data.map(row => {
          if (!row.time || !row.Ktemp) return null;
          
          const date = new Date(row.time);
          const year = date.getFullYear();
          const month = date.getMonth(); // 0-11
          const dayOfYear = Math.floor((date - new Date(year, 0, 0)) / (1000 * 60 * 60 * 24));
          const fTemp = (row.Ktemp - 273.15) * (9/5) + 32;
          
          return {
            ...row,
            date,
            year,
            month,
            monthName: new Date(0, month).toLocaleString('default', { month: 'short' }),
            dayOfYear,
            fTemp
          };
        }).filter(row => row !== null);
        
        // Calculate seasonal averages by year (meteorological seasons)
        const seasonsByYear = {};
        processedData.forEach(row => {
          if (!seasonsByYear[row.year]) {
            seasonsByYear[row.year] = {
              winter: { sum: 0, count: 0 }, // Dec, Jan, Feb
              spring: { sum: 0, count: 0 }, // Mar, Apr, May
              summer: { sum: 0, count: 0 }, // Jun, Jul, Aug
              fall: { sum: 0, count: 0 }    // Sep, Oct, Nov
            };
          }
          
          // Determine the season based on month
          let season;
          if (row.month === 11 || row.month === 0 || row.month === 1) {
            season = 'winter';
          } else if (row.month >= 2 && row.month <= 4) {
            season = 'spring';
          } else if (row.month >= 5 && row.month <= 7) {
            season = 'summer';
          } else {
            season = 'fall';
          }
          
          seasonsByYear[row.year][season].sum += row.fTemp;
          seasonsByYear[row.year][season].count += 1;
        });
        
        // Format seasonal data for visualization
        const seasonalTrends = [];
        Object.keys(seasonsByYear).sort().forEach(year => {
          const yearData = seasonsByYear[year];
          const seasonalAvgs = {
            year: parseInt(year),
            winter: yearData.winter.count > 0 ? yearData.winter.sum / yearData.winter.count : null,
            spring: yearData.spring.count > 0 ? yearData.spring.sum / yearData.spring.count : null,
            summer: yearData.summer.count > 0 ? yearData.summer.sum / yearData.summer.count : null,
            fall: yearData.fall.count > 0 ? yearData.fall.sum / yearData.fall.count : null
          };
          
          seasonalTrends.push(seasonalAvgs);
        });
        
        setSeasonalData(seasonalTrends);
        
        // Calculate temperature anomalies (deviation from baseline)
        // Using 1951-1980 as the baseline period (common in climate science)
        const baselineYears = seasonalTrends.filter(d => d.year >= 1951 && d.year <= 1980);
        
        // Calculate baseline averages for each season
        const baselineAvgs = {
          winter: baselineYears.reduce((sum, d) => sum + (d.winter || 0), 0) / baselineYears.length,
          spring: baselineYears.reduce((sum, d) => sum + (d.spring || 0), 0) / baselineYears.length,
          summer: baselineYears.reduce((sum, d) => sum + (d.summer || 0), 0) / baselineYears.length,
          fall: baselineYears.reduce((sum, d) => sum + (d.fall || 0), 0) / baselineYears.length
        };
        
        // Calculate anomalies for each year and season
        const anomalies = seasonalTrends.map(d => ({
          year: d.year,
          winter: d.winter !== null ? d.winter - baselineAvgs.winter : null,
          spring: d.spring !== null ? d.spring - baselineAvgs.spring : null,
          summer: d.summer !== null ? d.summer - baselineAvgs.summer : null,
          fall: d.fall !== null ? d.fall - baselineAvgs.fall : null
        }));
        
        setAnomalyData(anomalies);
        
        // Calculate decade averages for seasonal anomalies
        const decadeSeasonalAnomalies = {};
        anomalies.forEach(d => {
          const decade = Math.floor(d.year / 10) * 10;
          if (!decadeSeasonalAnomalies[decade]) {
            decadeSeasonalAnomalies[decade] = {
              winter: { sum: 0, count: 0 },
              spring: { sum: 0, count: 0 },
              summer: { sum: 0, count: 0 },
              fall: { sum: 0, count: 0 }
            };
          }
          
          ['winter', 'spring', 'summer', 'fall'].forEach(season => {
            if (d[season] !== null) {
              decadeSeasonalAnomalies[decade][season].sum += d[season];
              decadeSeasonalAnomalies[decade][season].count += 1;
            }
          });
        });
        
        // Format decade anomalies for visualization
        const decadeAnomaliesData = Object.keys(decadeSeasonalAnomalies).map(decade => {
          const data = decadeSeasonalAnomalies[decade];
          return {
            decade: parseInt(decade),
            label: `${decade}s`,
            winter: data.winter.count > 0 ? data.winter.sum / data.winter.count : null,
            spring: data.spring.count > 0 ? data.spring.sum / data.spring.count : null,
            summer: data.summer.count > 0 ? data.summer.sum / data.summer.count : null,
            fall: data.fall.count > 0 ? data.fall.sum / data.fall.count : null
          };
        }).sort((a, b) => a.decade - b.decade);
        
        setDecadeAnomalies(decadeAnomaliesData);
        
        // Check extreme temperature days by decade
        // Define extreme hot days as > 90°F and extreme cold days as < 20°F
        const extremesByDecade = {};
        processedData.forEach(row => {
          const decade = Math.floor(row.year / 10) * 10;
          if (!extremesByDecade[decade]) {
            extremesByDecade[decade] = {
              extremeHotDays: 0,
              extremeColdDays: 0,
              totalDays: 0
            };
          }
          
          if (row.fTemp > 90) {
            extremesByDecade[decade].extremeHotDays += 1;
          }
          
          if (row.fTemp < 20) {
            extremesByDecade[decade].extremeColdDays += 1;
          }
          
          extremesByDecade[decade].totalDays += 1;
        });
        
        // Format extreme days data
        const extremesData = Object.keys(extremesByDecade).map(decade => {
          const data = extremesByDecade[decade];
          const daysInDecade = data.totalDays;
          
          return {
            decade: parseInt(decade),
            label: `${decade}s`,
            extremeHotDays: data.extremeHotDays,
            extremeColdDays: data.extremeColdDays,
            hotDaysPct: (data.extremeHotDays / daysInDecade) * 100,
            coldDaysPct: (data.extremeColdDays / daysInDecade) * 100
          };
        }).sort((a, b) => a.decade - b.decade);
        
        setExtremeData(extremesData);
        
        // Calculate average seasonal cycle (day of year vs avg temp)
        const dayOfYearTemps = Array(366).fill(0).map(() => ({ sum: 0, count: 0 }));
        
        processedData.forEach(row => {
          if (row.dayOfYear > 0 && row.dayOfYear <= 366) {
            dayOfYearTemps[row.dayOfYear - 1].sum += row.fTemp;
            dayOfYearTemps[row.dayOfYear - 1].count += 1;
          }
        });
        
        const seasonalCycle = dayOfYearTemps.map((day, index) => {
          const dayNum = index + 1;
          let season;
          
          // Determine season based on day of year
          // Make sure these conditions cover all possible days and don't overlap
          if (dayNum <= 59 || dayNum > 335) { // Winter
            season = 'Winter';
          } else if (dayNum <= 151) { // Spring
            season = 'Spring';
          } else if (dayNum <= 243) { // Summer
            season = 'Summer';
          } else { // Fall
            season = 'Fall';
          }
          
          return {
            dayOfYear: dayNum,
            avgTemp: day.count > 0 ? day.sum / day.count : null,
            season
          };
        });
        
        setYearCycleData(seasonalCycle);
        setLoading(false);
      } catch (err) {
        console.error('Error processing data:', err);
        setError(`Failed to load weather data: ${err.message}`);
        setLoading(false);
      }
    };
    
    processData();
  }, []);
  
  const renderChart = () => {
    if (loading) {
      return <div className="loading">Loading data...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    switch (activeChart) {
      case 'seasonalRadar':
        // Get data for first and last decades for comparison
        const firstDecade = decadeAnomalies[0];
        const lastDecade = decadeAnomalies[decadeAnomalies.length - 1];
        
        // Format data for radar chart
        const radarData = [
          {
            subject: 'Winter',
            '1950s': firstDecade.winter,
            '2020s': lastDecade.winter,
            fullMark: 6
          },
          {
            subject: 'Spring',
            '1950s': firstDecade.spring,
            '2020s': lastDecade.spring,
            fullMark: 6
          },
          {
            subject: 'Summer',
            '1950s': firstDecade.summer,
            '2020s': lastDecade.summer,
            fullMark: 6
          },
          {
            subject: 'Fall',
            '1950s': firstDecade.fall,
            '2020s': lastDecade.fall,
            fullMark: 6
          }
        ];
        
        return (
          <div>
            <h3>Seasonal Temperature Anomalies: 1950s vs 2020s</h3>
            <p>
              This radar chart compares temperature anomalies across seasons between
              the first and last decades in our dataset. The further from center, the
              greater the temperature increase from the 1951-1980 baseline.
            </p>
            <div style={{ height: '500px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={180} width={730} height={500} data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 6]} />
                  <Radar
                    name="1950s"
                    dataKey="1950s"
                    stroke={seasonColors.winter}
                    fill={seasonColors.winter}
                    fillOpacity={0.5}
                  />
                  <Radar
                    name="2020s"
                    dataKey="2020s"
                    stroke="#ff5252"
                    fill="#ff5252"
                    fillOpacity={0.5}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="insights">
              <h4>Key Insights:</h4>
              <ul>
                <li>Winter has seen the most dramatic temperature increase between the 1950s and 2020s</li>
                <li>All seasons show warming, with winter warming by approximately {(lastDecade.winter - firstDecade.winter).toFixed(1)}°F</li>
                <li>The 2020s show significantly larger temperature anomalies across all seasons</li>
              </ul>
            </div>
          </div>
        );
      
      case 'seasonalTrends':
        return (
          <div>
            <h3>Seasonal Temperature Trends (1950-2021)</h3>
            <p>
              This chart shows temperature trends for each season over the entire time period,
              highlighting how different seasons have changed at different rates.
            </p>
            <div style={{ height: '500px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={seasonalData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="winter"
                    stroke={seasonColors.winter}
                    dot={false}
                    name="Winter"
                  />
                  <Line
                    type="monotone"
                    dataKey="spring"
                    stroke={seasonColors.spring}
                    dot={false}
                    name="Spring"
                  />
                  <Line
                    type="monotone"
                    dataKey="summer"
                    stroke={seasonColors.summer}
                    dot={false}
                    name="Summer"
                  />
                  <Line
                    type="monotone"
                    dataKey="fall"
                    stroke={seasonColors.fall}
                    dot={false}
                    name="Fall"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="insights">
              <h4>Key Insights:</h4>
              <ul>
                <li>Summer temperatures consistently remain the highest, while winter temperatures remain the lowest</li>
                <li>All seasons show an upward trend, particularly since the 1980s</li>
                <li>Year-to-year variability is highest in winter temperatures</li>
              </ul>
            </div>
          </div>
        );
      
      case 'anomalyHeatmap':
        // Prepare data for decade anomaly heatmap
        const heatmapData = decadeAnomalies.map(d => ({
          name: d.label,
          Winter: d.winter,
          Spring: d.spring,
          Summer: d.summer,
          Fall: d.fall
        }));
        
        return (
          <div>
            <h3>Temperature Anomaly by Decade and Season</h3>
      <p>
        This chart shows how temperature anomalies have changed by decade and season.
        Positive values indicate temperatures above the 1951-1980 baseline,
        while negative values indicate temperatures below baseline.
      </p>
      <div style={{ height: '500px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={heatmapData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 70, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              domain={[-2, 6]} 
              label={{ value: 'Temperature Anomaly (°F)', position: 'bottom' }}
            />
            <YAxis dataKey="name" type="category" width={80} />
            <Tooltip />
            <Legend content={(props) => {
  const { payload } = props;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
      {payload.map((entry, index) => (
        <div key={`item-${index}`} style={{ marginRight: 20 }}>
          <span style={{ 
            display: 'inline-block', 
            width: 10, 
            height: 10, 
            backgroundColor: entry.color, 
            marginRight: 5 
          }}></span>
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}} />
            <ReferenceLine x={0} stroke="#000" />
            <Bar 
  dataKey="Winter" 
  name="Winter" 
  fill={seasonColors.winter} 
  background={{ fill: '#eee' }}
  barSize={20}
/>
            
            <Bar 
              dataKey="Spring" 
              name="Spring" 
              fill={seasonColors.spring}
            />
            <Bar 
              dataKey="Summer" 
              name="Summer" 
              fill={seasonColors.summer}
            />
            <Bar 
              dataKey="Fall" 
              name="Fall" 
              fill={seasonColors.fall}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="insights">
        <h4>Key Insights:</h4>
              <ul>
                <li>The 1960s was the only decade that showed cooling across all seasons relative to the baseline</li>
                <li>The 2020s show the most dramatic warming across all seasons</li>
                <li>Winter in the 2020s shows the largest temperature anomaly, over 5°F warmer than the baseline</li>
                <li>A clear warming trend is visible starting from the 1980s</li>
              </ul>
            </div>
          </div>
        );
      
      case 'extremeDays':
        return (
          <div>
            <h3>Extreme Temperature Days by Decade</h3>
            <p>
              This chart shows the percentage of days with extreme temperatures in each decade.
              Cold days (blue) are below 20°F, while hot days (red) are above 90°F.
            </p>
            <div style={{ height: '500px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={extremeData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis label={{ value: '% of Days', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="coldDaysPct" 
                    name="Extremely Cold Days (<20°F)" 
                    fill="#6ab4ff" 
                  />
                  <Bar 
                    dataKey="hotDaysPct" 
                    name="Extremely Hot Days (>90°F)" 
                    fill="#ff5252" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="insights">
              <h4>Key Insights:</h4>
              <ul>
                <li>The 1960s had the highest percentage of extremely cold days (below 20°F)</li>
                <li>Extremely cold days have been decreasing in recent decades</li>
                <li>Extremely hot days (above 90°F) are extremely rare in this location, appearing only once in the 2010s</li>
                <li>The 2020s show no extreme temperature days in either direction, suggesting a narrowing of temperature extremes</li>
              </ul>
            </div>
          </div>
        );
      
      case 'seasonalCycle':
        
          // Get a smoothed version of the year cycle (7-day moving average)
          const smoothedCycle = [...yearCycleData];
          for (let i = 3; i < smoothedCycle.length - 3; i++) {
            const windowValues = [];
            for (let j = i - 3; j <= i + 3; j++) {
              if (smoothedCycle[j].avgTemp !== null) {
                windowValues.push(smoothedCycle[j].avgTemp);
              }
            }
            if (windowValues.length > 0) {
              const avg = windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length;
              smoothedCycle[i].smoothedTemp = avg;
            }
          }
          
          // Create better defined season boundaries for visualization
          const enhancedData = smoothedCycle.map(d => {
            // Explicitly check each day's season correctly
            let season;
            if ((d.dayOfYear >= 1 && d.dayOfYear <= 59) || (d.dayOfYear >= 335 && d.dayOfYear <= 366)) {
              season = 'Winter';
            } else if (d.dayOfYear >= 60 && d.dayOfYear <= 151) {
              season = 'Spring';
            } else if (d.dayOfYear >= 152 && d.dayOfYear <= 243) {
              season = 'Summer';
            } else {
              season = 'Fall';
            }
            
            return {
              ...d,
              correctedSeason: season
            };
          });
        
        return (
          <div>
             
             <h3>Annual Temperature Cycle (1950-2021)</h3>
      <p>
        This chart shows the average temperature for each day of the year,
        highlighting seasonal patterns. The colored background shows the four seasons.
      </p>
      <div style={{ height: '500px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="dayOfYear" 
              name="Day of Year"
              type="number"
              domain={[1, 366]}
              ticks={[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345]} 
              tickFormatter={(tick) => {
                const date = new Date(2020, 0, tick);
                return date.toLocaleString('default', { month: 'short' });
              }}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis 
              label={{ value: 'Temperature (°F)', angle: -90, position: 'insideLeft' }} 
              domain={[0, 85]} 
            />
            <Tooltip
              formatter={(value, name) => {
                if (value === null) return ['', ''];
                if (name === 'Daily Average Temperature') {
                  return [`${value.toFixed(1)}°F`, name];
                }
                return ['', ''];
              }}
              labelFormatter={(label) => {
                const date = new Date(2020, 0, label);
                return date.toLocaleString('default', { month: 'long', day: 'numeric' });
              }}
            />
            <Legend />
            
            {/* Winter data - using a reference area for Jan-Feb and Dec */}
            <ReferenceArea 
              x1={1} 
              x2={59} 
              y1={0} 
              y2={85} 
              fill={seasonColors.winter} 
              fillOpacity={0.2} 
              stroke="none" 
            />
            <ReferenceArea 
              x1={335} 
              x2={366} 
              y1={0} 
              y2={85} 
              fill={seasonColors.winter} 
              fillOpacity={0.2} 
              stroke="none" 
            />
            
            {/* Spring data */}
            <ReferenceArea 
              x1={60} 
              x2={151} 
              y1={0} 
              y2={85} 
              fill={seasonColors.spring} 
              fillOpacity={0.2} 
              stroke="none" 
            />
            
            {/* Summer data */}
            <ReferenceArea 
              x1={152} 
              x2={243} 
              y1={0} 
              y2={85} 
              fill={seasonColors.summer} 
              fillOpacity={0.2} 
              stroke="none" 
            />
            
            {/* Fall data */}
            <ReferenceArea 
              x1={244} 
              x2={334} 
              y1={0} 
              y2={85} 
              fill={seasonColors.fall} 
              fillOpacity={0.2} 
              stroke="none" 
            />
            
            {/* Display the actual temperature line on top */}
            <Line
              data={enhancedData}
              type="monotone"
              dataKey="smoothedTemp"
              stroke="#ff5252"
              name="Daily Average Temperature"
              dot={false}
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="insights">
        <h4>Key Insights:</h4>
        <ul>
          <li>The annual temperature cycle shows a clear sinusoidal pattern</li>
          <li>The warmest days typically occur in late July, about a month after the summer solstice</li>
          <li>The coldest days typically occur in late January, about a month after the winter solstice</li>
          <li>Spring warming happens more gradually than fall cooling, creating asymmetry in the annual cycle</li>
        </ul>
      </div>
          </div>
        );
        
      default:
        return <div>Select a chart to view</div>;
    }
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Climate Patterns and Change at Cornell Tech (1950-2021)</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p>
          This creative visualization explores various aspects of Cornell Tech's climate patterns and how they've
          changed over the past seven decades. We examine seasonal variations, long-term trends, temperature anomalies,
          and extreme weather events to gain insights into the changing climate conditions.
        </p>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={() => setActiveChart('seasonalRadar')}
            style={{
              padding: '10px 15px',
              backgroundColor: activeChart === 'seasonalRadar' ? '#4a6fa5' : '#e0e0e0',
              color: activeChart === 'seasonalRadar' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeChart === 'seasonalRadar' ? 'bold' : 'normal'
            }}
          >
            1950s vs 2020s Comparison
          </button>
          <button
            onClick={() => setActiveChart('seasonalTrends')}
            style={{
              padding: '10px 15px',
              backgroundColor: activeChart === 'seasonalTrends' ? '#4a6fa5' : '#e0e0e0',
              color: activeChart === 'seasonalTrends' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeChart === 'seasonalTrends' ? 'bold' : 'normal'
            }}
          >
            Seasonal Temperature Trends
          </button>
          <button
            onClick={() => setActiveChart('anomalyHeatmap')}
            style={{
              padding: '10px 15px',
              backgroundColor: activeChart === 'anomalyHeatmap' ? '#4a6fa5' : '#e0e0e0',
              color: activeChart === 'anomalyHeatmap' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeChart === 'anomalyHeatmap' ? 'bold' : 'normal'
            }}
          >
            Decade Anomalies
          </button>
          <button
            onClick={() => setActiveChart('extremeDays')}
            style={{
              padding: '10px 15px',
              backgroundColor: activeChart === 'extremeDays' ? '#4a6fa5' : '#e0e0e0',
              color: activeChart === 'extremeDays' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeChart === 'extremeDays' ? 'bold' : 'normal'
            }}
          >
            Extreme Temperature Days
          </button>
          <button
            onClick={() => setActiveChart('seasonalCycle')}
            style={{
              padding: '10px 15px',
              backgroundColor: activeChart === 'seasonalCycle' ? '#4a6fa5' : '#e0e0e0',
              color: activeChart === 'seasonalCycle' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeChart === 'seasonalCycle' ? 'bold' : 'normal'
            }}
          >
            Annual Temperature Cycle
          </button>
        </div>
      </div>
      
      <div style={{
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {renderChart()}
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <h3>Overall Climate Insights</h3>
        <p>
          Our analysis of Cornell Tech's historical temperature data reveals several important patterns:
        </p>
        <ol style={{ paddingLeft: '20px' }}>
          <li style={{ marginBottom: '10px' }}>
            <strong>Seasonal Warming:</strong> All seasons have warmed since the 1950s, but winter has experienced 
            the most dramatic increase, warming over 5°F since the baseline period.
          </li>
          <li style={{ marginBottom: '10px' }}>
            <strong>Decreasing Extreme Cold:</strong> Extremely cold days (below 20°F) have become less frequent 
            in recent decades, while extremely hot days remain rare at this location.
          </li>
          <li style={{ marginBottom: '10px' }}>
            <strong>Acceleration of Warming:</strong> The rate of warming has increased significantly since the 1980s, 
            with each decade generally warmer than the last.
          </li>
          <li style={{ marginBottom: '10px' }}>
            <strong>Seasonal Patterns:</strong> Despite warming, the basic seasonal cycle remains consistent, with peak 
            temperatures in late July and minimum temperatures in late January.
          </li>
        </ol>
        <p>
          These visualizations help illustrate the complex ways climate change is affecting Cornell Tech's local 
          climate, with implications for building design, energy use, and outdoor activities throughout the year.
        </p>
      </div>
    </div>
  );
};

export default CreativeWeatherVisualization;