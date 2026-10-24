import React, { useState } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import PatientRegistry from './components/PatientRegistry';
import CallsView from './components/CallsView';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:8080' : window.location.origin);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [purgeKey, setPurgeKey] = useState(0);

  const handlePurgeAll = async () => {
    if (!window.confirm("Are you sure you want to purge all patient records and call history from the database?")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/patients/purge-all`, {
        method: 'POST'
      });
      if (res.ok) {
        setPurgeKey(prev => prev + 1);
        alert("All database records successfully purged!");
      }
    } catch (e) {
      console.error("Purge error:", e);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onPurgeAll={handlePurgeAll}
      />

      <main style={{ padding: '28px 36px', maxWidth: '1440px', margin: '0 auto' }}>
        {activeTab === 'dashboard' && (
          <DashboardView 
            key={`dashboard-${purgeKey}`}
            onNavigateToPatients={() => setActiveTab('patients')}
            onNavigateToCalls={() => setActiveTab('calls')}
          />
        )}

        {activeTab === 'patients' && (
          <PatientRegistry key={`patients-${purgeKey}`} />
        )}

        {activeTab === 'calls' && (
          <CallsView key={`calls-${purgeKey}`} />
        )}
      </main>
    </div>
  );
}


