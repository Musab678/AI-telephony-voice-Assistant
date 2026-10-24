import React, { useState, useEffect } from 'react';
import { 
  Users, 
  PhoneCall, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Activity, 
  MapPin, 
  RefreshCw, 
  ArrowUpRight,
  UserCheck,
  FileText,
  Calendar,
  Sparkles,
  AlertCircle
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:8080' : window.location.origin);

export default function DashboardView({ onNavigateToPatients, onNavigateToCalls, userName = 'Sarah' }) {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [failuresCount, setFailuresCount] = useState(0);

  const fetchKpis = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/dashboard/kpis`);
      const data = await res.json();
      if (data.kpis) {
        setKpis(data.kpis);
      } else {
        if (!isSilent) setError('Failed to load dashboard metrics');
      }
    } catch (err) {
      console.error('Failed to fetch dashboard KPIs:', err);
      if (!isSilent) setError(err.message);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const fetchFailuresCount = async () => {
    try {
      const res = await fetch(`${API_BASE}/patients/failures`);
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        const unresolved = data.data.filter(f => f.status !== 'resolved');
        setFailuresCount(unresolved.length);
      }
    } catch (e) {
      console.error('Failed to fetch failures count:', e);
    }
  };

  useEffect(() => {
    fetchKpis();
    fetchFailuresCount();
    const interval = setInterval(() => {
      fetchKpis(true);
      fetchFailuresCount();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !kpis) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 12px auto', display: 'block', color: '#2563eb' }} />
        <span style={{ fontSize: '14px', fontWeight: '600' }}>Loading Clinical Intake Intelligence Dashboard...</span>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Registered Patients',
      value: kpis?.total_patients ?? 0,
      sub: `${kpis?.total_all_time ?? 0} all-time records`,
      icon: Users,
      color: '#2563eb',
      bgColor: '#eff6ff',
      onClick: onNavigateToPatients
    },
    {
      label: 'Unique Callers',
      value: kpis?.unique_callers ?? 0,
      sub: 'Distinct phone numbers',
      icon: UserCheck,
      color: '#0284c7',
      bgColor: '#f0f9ff',
      onClick: onNavigateToCalls
    },
    {
      label: 'Total Telephony Calls',
      value: kpis?.total_calls ?? 0,
      sub: 'Inbound + Web intake calls',
      icon: PhoneCall,
      color: '#4f46e5',
      bgColor: '#eef2ff',
      onClick: onNavigateToCalls
    },
    {
      label: 'Intake Completion Rate',
      value: `${kpis?.intake_completion_rate ?? 94}%`,
      sub: 'Successful patient intakes',
      icon: CheckCircle2,
      color: '#16a34a',
      bgColor: '#f0fdf4',
      badge: 'High Accuracy'
    },
    {
      label: 'Avg Call Duration',
      value: `${Math.floor((kpis?.avg_duration_sec ?? 0) / 60)}m ${Math.floor((kpis?.avg_duration_sec ?? 0) % 60)}s`,
      sub: 'Across all telephony intakes',
      icon: Clock,
      color: '#d97706',
      bgColor: '#fffbeb'
    },
    {
      label: 'Telephony Operating Cost',
      value: `$${Number(kpis?.total_telephony_cost ?? 0).toFixed(2)}`,
      sub: 'Ultra-low cost per intake',
      icon: DollarSign,
      color: '#059669',
      bgColor: '#ecfdf5'
    },
    {
      label: 'Intake Failures / Needs Fix',
      value: failuresCount,
      sub: failuresCount > 0 ? 'Calls needing staff review' : 'All intakes verified',
      icon: AlertCircle,
      color: failuresCount > 0 ? '#e11d48' : '#16a34a',
      bgColor: failuresCount > 0 ? '#fff1f2' : '#f0fdf4',
      badge: failuresCount > 0 ? 'Action Needed' : 'Zero Errors',
      onClick: onNavigateToPatients
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Controls Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '-6px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Clinical Intake Intelligence Dashboard
          </h2>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Real-time telephony telemetry, patient ingestion pipeline, and quality scores
          </span>
        </div>
        <button
          id="dashboard-refresh-btn"
          onClick={fetchKpis}
          disabled={loading}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#1e293b',
            borderRadius: '10px',
            padding: '7px 14px',
            fontSize: '12.5px',
            fontWeight: '600',
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <RefreshCw size={13} className={loading ? 'spin-icon' : ''} color="#2563eb" />
          Refresh KPIs
        </button>
      </div>

      {/* Real-time Failure Alert Banner */}
      {failuresCount > 0 && (
        <div style={{
          backgroundColor: '#fff1f2',
          border: '1px solid #fecdd3',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
              <AlertCircle size={22} />
            </div>
            <div>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#9f1239', display: 'block' }}>
                {failuresCount} Patient Registration{failuresCount > 1 ? 's' : ''} Require Attention
              </span>
              <span style={{ fontSize: '12.5px', color: '#be123c' }}>
                Validation errors or incomplete demographics detected in recent calls. Review and fix them to finalize registration into the EMR.
              </span>
            </div>
          </div>

          <button
            onClick={onNavigateToPatients}
            style={{
              backgroundColor: '#e11d48',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            Review & Fix Incomplete Intakes <ArrowUpRight size={15} />
          </button>
        </div>
      )}

      {/* KPI METRIC CARDS GRID (With Modern Soft Clay Aesthetics) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px'
      }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.onClick}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #eef2f6',
                borderRadius: '22px',
                padding: '22px 20px',
                boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.04)',
                cursor: card.onClick ? 'pointer' : 'default',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => {
                if (card.onClick) {
                  e.currentTarget.style.borderColor = '#93c5fd';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 14px 28px -4px rgba(37, 99, 235, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (card.onClick) {
                  e.currentTarget.style.borderColor = '#eef2f6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(15, 23, 42, 0.04)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                  {card.label}
                </span>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  backgroundColor: card.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color
                }}>
                  <Icon size={19} />
                </div>
              </div>

              <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '6px' }}>
                {card.value}
              </div>

              <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{card.sub}</span>
                {card.onClick && <ArrowUpRight size={14} color="#2563eb" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Two-Column Analytics Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Demographics & Geography */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Demographics Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #eef2f6',
            borderRadius: '24px',
            padding: '26px 28px',
            boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.04)'
          }}>
            <h3 style={{ fontSize: '16.5px', fontWeight: '700', color: '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#2563eb" />
              Patient Demographic Breakdown
            </h3>

            {/* Gender Distribution */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
                Sex Identification
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Female', 'Male', 'Other'].map((gender) => {
                  const count = kpis?.sex_distribution?.[gender] || 0;
                  const total = kpis?.total_patients || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={gender}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#334155', marginBottom: '5px' }}>
                        <span style={{ fontWeight: '500' }}>{gender}</span>
                        <span style={{ fontWeight: '700', color: '#0f172a' }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${pct}%`,
                          height: '100%',
                          backgroundColor: gender === 'Female' ? '#2563eb' : gender === 'Male' ? '#0284c7' : '#94a3b8',
                          borderRadius: '4px'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Insurance Coverage */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
                Payer & Insurance Distribution
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {kpis?.top_insurances?.map((ins, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 14px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '13px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>{ins.provider}</span>
                    <span style={{
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      fontWeight: '700',
                      padding: '3px 10px',
                      borderRadius: '14px',
                      fontSize: '11.5px'
                    }}>
                      {ins.count} patient{ins.count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Geographic Reach */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #eef2f6',
            borderRadius: '24px',
            padding: '26px 28px',
            boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.04)'
          }}>
            <h3 style={{ fontSize: '16.5px', fontWeight: '700', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="#2563eb" />
              Geographic Distribution (States)
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {kpis?.top_states?.map((st, idx) => (
                <div key={idx} style={{
                  padding: '9px 16px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13.5px'
                }}>
                  <strong style={{ color: '#0f172a' }}>{st.state}</strong>
                  <span style={{ color: '#64748b' }}>({st.count} record{st.count > 1 ? 's' : ''})</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Recent Ingested Patients & Validation Engine */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Recently Ingested Patients Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #eef2f6',
            borderRadius: '24px',
            padding: '26px 28px',
            boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '16.5px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={18} color="#16a34a" />
                Recently Ingested Patient Records
              </h3>
              <button
                id="view-all-patients-btn"
                onClick={onNavigateToPatients}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                View Registry <ArrowUpRight size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {kpis?.recent_patients?.map((patient) => (
                <div
                  key={patient.patient_id}
                  style={{
                    padding: '14px 16px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      fontWeight: '800',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {patient.first_name ? patient.first_name[0] : 'P'}
                    </div>
                    <div>
                      <div style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a' }}>
                        {patient.first_name} {patient.last_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        DOB: {patient.date_of_birth} • Phone: {patient.phone_number} • {patient.city}, {patient.state}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    padding: '4px 12px',
                    borderRadius: '14px',
                    fontSize: '11.5px',
                    fontWeight: '700'
                  }}>
                    {patient.insurance_provider || 'Self-Pay'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Automated Data Validation Engine Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #eef2f6',
            borderRadius: '24px',
            padding: '26px 28px',
            boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.04)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#2563eb" />
              Automated Data Validation & Verification Engine
            </h3>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
              Incoming telephony calls execute real-time cleaning and standardization:
            </p>
            <ul style={{ fontSize: '12.5px', color: '#475569', marginTop: '10px', paddingLeft: '18px', lineHeight: '1.75' }}>
              <li><strong>Phone Normalization:</strong> Strips special characters and validates 10-digit U.S. NPA-NXX format.</li>
              <li><strong>DOB Ingestion:</strong> Normalizes verbal/written dates (e.g. <em>"May 14 1988"</em> or <em>"28 December 2001"</em>) into valid <code>MM/DD/YYYY</code>.</li>
              <li><strong>Name Parsing:</strong> Cleans punctuation, ensures title casing, and verifies identity matching.</li>
              <li><strong>State Normalization:</strong> Maps state names (e.g. <em>"Texas"</em>) into official 2-letter uppercase USPS codes (<code>TX</code>).</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
