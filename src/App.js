import React, { useState } from 'react';
import WeatherVisualization from './components/WeatherVisualization';
import CreativeWeatherVisualization from './CreativeWeatherVisualization';

function App() {
  const [activeTab, setActiveTab] = useState('monthly');
  
  // Tab button component
  const TabButton = ({ id, label, activeTab, setActiveTab }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: '12px 20px',
        backgroundColor: activeTab === id ? '#3b82f6' : '#e5e7eb',
        color: activeTab === id ? 'white' : '#374151',
        border: 'none',
        borderRadius: '4px',
        margin: '0 10px 20px 0',
        cursor: 'pointer',
        fontWeight: activeTab === id ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      }}
    >
      {label}
    </button>
  );
  
  return (
    <div className="app" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Cornell Tech Weather Data Analysis (1950-2021)</h1>
        <p style={{ maxWidth: '800px', margin: '0 auto', color: '#555' }}>
          A comprehensive visualization of temperature patterns, seasonal trends, and climate changes observed at Cornell Tech
        </p>
      </header>
      
      <div className="tab-buttons" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        <TabButton
          id="monthly"
          label="Part A: Monthly Temperature Patterns"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <TabButton
          id="yearly"
          label="Part B: 55°F Threshold Analysis"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <TabButton
          id="creative"
          label="Part C: Creative Climate Visualization"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
      
      <div className="tab-content" style={{ 
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {(activeTab === 'monthly' || activeTab === 'yearly') && 
          <WeatherVisualization initialTab={activeTab} />
        }
        
        {activeTab === 'creative' && 
          <CreativeWeatherVisualization />
        }
      </div>
      
      <footer style={{ marginTop: '40px', textAlign: 'center', color: '#777', fontSize: '0.9rem' }}>
        <p>Created for Cornell Tech Weather Data Analysis Assignment</p>
        <p>Data source: Weather measurements near Cornell Tech, 1950-2021</p>
      </footer>
    </div>
  );
}

export default App;