import React from 'react';
import { PhoneCall, Users, Activity, Trash2, Plus } from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab,
  onPurgeAll
}) {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 36px',
      borderBottom: '1px solid #e2e8f0',
      backgroundColor: '#ffffff',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Left: Clinic Title with Red Medical Cross Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div 
          onClick={() => setActiveTab('dashboard')} 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          {/* Official Red Cross (+) Sign Logo */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)'
          }}>
            <Plus size={24} strokeWidth={3.5} />
          </div>
          <div>
            <span style={{ 
              fontSize: '18px', 
              fontWeight: '800', 
              color: '#0f172a', 
              letterSpacing: '-0.3px',
              display: 'block',
              lineHeight: 1.15
            }}>
              Metro Health Clinic
            </span>
            <span style={{ fontSize: '11.5px', color: '#2563eb', fontWeight: '700' }}>
              Patient Intake Voice AI
            </span>
          </div>
        </div>
      </div>

      {/* Center: Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {[
          { id: 'dashboard', label: 'Overview & KPIs', icon: Activity },
          { id: 'patients', label: 'Patient Registry', icon: Users },
          { id: 'calls', label: 'Telephony Calls & Audio', icon: PhoneCall },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              id={`nav-tab-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                backgroundColor: isActive ? '#eff6ff' : 'transparent',
                border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                borderRadius: '8px',
                color: isActive ? '#1d4ed8' : '#64748b',
                fontSize: '13.5px',
                fontWeight: isActive ? '700' : '600',
                padding: '8px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} color={isActive ? '#2563eb' : '#64748b'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Right: Quick Actions (hidden on Dashboard view, visible on Patient Registry & Telephony Calls) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {activeTab !== 'dashboard' && (
          <button
            id="nav-purge-all-btn"
            onClick={onPurgeAll}
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Clear all database records (patients & calls) for a fresh state"
          >
            <Trash2 size={13} />
            Purge All Data
          </button>
        )}
      </div>
    </nav>
  );
}


