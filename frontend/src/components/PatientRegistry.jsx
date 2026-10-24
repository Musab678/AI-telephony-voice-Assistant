import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  PhoneCall, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  FileText, 
  X, 
  RefreshCw,
  Copy,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:8080' : window.location.origin);

export default function PatientRegistry() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLastName, setSearchLastName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchDob, setSearchDob] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // Tab state: 'patients' | 'failures'
  const [currentTab, setCurrentTab] = useState('patients');
  const [failures, setFailures] = useState([]);
  const [showFixModal, setShowFixModal] = useState(false);
  const [selectedFailure, setSelectedFailure] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientCalls, setPatientCalls] = useState([]);

  // Create / Edit Form State
  const initialForm = {
    first_name: '',
    last_name: '',
    date_of_birth: '',
    sex: 'Male',
    phone_number: '',
    email: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    insurance_provider: '',
    insurance_member_id: '',
    preferred_language: 'English',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Patients with Elastic Multi-Field Search (supports silent real-time auto-polling)
  const fetchPatients = async (overrideFilters = null, isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const lastName = overrideFilters?.lastName !== undefined ? overrideFilters.lastName : searchLastName;
      const phone = overrideFilters?.phone !== undefined ? overrideFilters.phone : searchPhone;
      const dob = overrideFilters?.dob !== undefined ? overrideFilters.dob : searchDob;
      const del = overrideFilters?.includeDeleted !== undefined ? overrideFilters.includeDeleted : includeDeleted;

      let url = `${API_BASE}/patients?include_deleted=${del}`;
      if (lastName && lastName.trim()) url += `&q=${encodeURIComponent(lastName.trim())}`;
      if (phone && phone.trim()) url += `&phone_number=${encodeURIComponent(phone.trim())}`;
      if (dob && dob.trim()) url += `&date_of_birth=${encodeURIComponent(dob.trim())}`;

      const res = await fetch(url);
      const resJson = await res.json();
      if (resJson && Array.isArray(resJson.data)) {
        setPatients(resJson.data);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Fetch Registration Failures & Incomplete Intakes in Real-Time
  const fetchFailures = async (isSilent = false) => {
    try {
      const res = await fetch(`${API_BASE}/patients/failures`);
      const resJson = await res.json();
      if (resJson && Array.isArray(resJson.data)) {
        setFailures(resJson.data);
      }
    } catch (err) {
      console.error('Failed to fetch failures:', err);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchFailures();
    // Continuous 3-second real-time polling to pick up new call registrations and validation failures automatically
    const interval = setInterval(() => {
      fetchPatients(null, true);
      fetchFailures(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [includeDeleted]);

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    fetchPatients();
  };

  const handleResetSearch = () => {
    setSearchLastName('');
    setSearchPhone('');
    setSearchDob('');
    fetchPatients({ lastName: '', phone: '', dob: '' });
  };

  // Open Details Modal & Fetch Call History
  const handleViewDetails = async (patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
    try {
      const res = await fetch(`${API_BASE}/patients/${patient.patient_id}/calls`);
      const data = await res.json();
      setPatientCalls(data.data || []);
    } catch (e) {
      setPatientCalls([]);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      date_of_birth: patient.date_of_birth || '',
      sex: patient.sex || 'Female',
      phone_number: patient.phone_number || '',
      email: patient.email || '',
      address_line_1: patient.address_line_1 || '',
      address_line_2: patient.address_line_2 || '',
      city: patient.city || '',
      state: patient.state || '',
      zip_code: patient.zip_code || '',
      insurance_provider: patient.insurance_provider || '',
      insurance_member_id: patient.insurance_member_id || '',
      preferred_language: patient.preferred_language || 'English',
      emergency_contact_name: patient.emergency_contact_name || '',
      emergency_contact_phone: patient.emergency_contact_phone || ''
    });
    setFormError(null);
    setShowEditModal(true);
  };

  // Create Patient Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.status === 201) {
        setShowCreateModal(false);
        setFormData(initialForm);
        fetchPatients();
      } else {
        const errorMsg = typeof data.error === 'object' ? JSON.stringify(data.error) : (data.error || 'Failed to create patient');
        setFormError(errorMsg);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Patient Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/patients/${selectedPatient.patient_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        fetchPatients();
      } else {
        const errorMsg = typeof data.error === 'object' ? JSON.stringify(data.error) : (data.error || 'Failed to update patient');
        setFormError(errorMsg);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Soft Delete Patient
  const handleDeletePatient = async (patientId) => {
    if (!window.confirm("Are you sure you want to soft delete this patient record?")) return;
    try {
      const res = await fetch(`${API_BASE}/patients/${patientId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPatients();
      }
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  // Purge Single Patient
  const handlePurgePatient = async (patientId) => {
    if (!window.confirm("Permanently purge this patient record and all related telephony logs? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/patients/${patientId}/purge`, { method: 'DELETE' });
      if (res.ok) {
        fetchPatients();
      }
    } catch (e) {
      console.error('Purge failed:', e);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleOpenFix = (failure) => {
    setSelectedFailure(failure);
    const p = failure.parsed_payload || {};
    const rawPhone = p.phone_number || failure.caller_phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);

    setFormData({
      first_name: p.first_name || '',
      last_name: p.last_name || '',
      date_of_birth: p.date_of_birth || '',
      sex: p.sex || 'Male',
      phone_number: cleanPhone || rawPhone,
      email: p.email || '',
      address_line_1: p.address_line_1 || '',
      address_line_2: p.address_line_2 || '',
      city: p.city || '',
      state: p.state || '',
      zip_code: p.zip_code || '',
      insurance_provider: p.insurance_provider || '',
      insurance_member_id: p.insurance_member_id || '',
      preferred_language: p.preferred_language || 'English',
      emergency_contact_name: p.emergency_contact_name || '',
      emergency_contact_phone: p.emergency_contact_phone || ''
    });
    setFormError(null);
    setShowFixModal(true);
  };

  const handleFixSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/patients/failures/${selectedFailure.id}/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setShowFixModal(false);
        setSuccessToast(`Patient ${formData.first_name} ${formData.last_name} successfully registered and resolved!`);
        setTimeout(() => setSuccessToast(null), 5000);
        fetchPatients();
        fetchFailures();
        setCurrentTab('patients');
      } else {
        const errorMsg = typeof data.error === 'object' ? JSON.stringify(data.error) : (data.error || 'Failed to fix and register patient');
        setFormError(errorMsg);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissFailure = async (failureId) => {
    try {
      await fetch(`${API_BASE}/patients/failures/${failureId}/dismiss`, { method: 'POST' });
      fetchFailures();
    } catch (e) {
      console.error('Dismiss failed:', e);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
            Patient Registry & Demographic Records
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Live clinical database with multi-field search and full EMR demographic records
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setFormData(initialForm);
              setFormError(null);
              setShowCreateModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#2563eb',
              border: 'none',
              color: '#ffffff',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Plus size={16} />
            Register Patient (Manual)
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '600',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Mode Tabs: Registered Patients vs Failed / Incomplete Intakes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setCurrentTab('patients')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: currentTab === 'patients' ? '2px solid #2563eb' : '1px solid #cbd5e1',
            backgroundColor: currentTab === 'patients' ? '#eff6ff' : '#ffffff',
            color: currentTab === 'patients' ? '#1d4ed8' : '#475569',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: currentTab === 'patients' ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={16} />
          Registered Patients
          <span style={{
            backgroundColor: currentTab === 'patients' ? '#2563eb' : '#e2e8f0',
            color: currentTab === 'patients' ? '#ffffff' : '#475569',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '800'
          }}>
            {patients.length}
          </span>
        </button>

        <button
          onClick={() => setCurrentTab('failures')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: currentTab === 'failures' ? '2px solid #e11d48' : (failures.filter(f => f.status !== 'resolved').length > 0 ? '1px solid #fecdd3' : '1px solid #cbd5e1'),
            backgroundColor: currentTab === 'failures' ? '#fff1f2' : (failures.filter(f => f.status !== 'resolved').length > 0 ? '#fff5f5' : '#ffffff'),
            color: currentTab === 'failures' ? '#be123c' : (failures.filter(f => f.status !== 'resolved').length > 0 ? '#e11d48' : '#475569'),
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: currentTab === 'failures' ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <AlertCircle size={16} color={failures.filter(f => f.status !== 'resolved').length > 0 ? '#e11d48' : '#64748b'} />
          Real-Time Registration Failures & Needs Attention
          <span style={{
            backgroundColor: failures.filter(f => f.status !== 'resolved').length > 0 ? '#e11d48' : '#e2e8f0',
            color: failures.filter(f => f.status !== 'resolved').length > 0 ? '#ffffff' : '#475569',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '800'
          }}>
            {failures.filter(f => f.status !== 'resolved').length}
          </span>
        </button>
      </div>

      {currentTab === 'patients' ? (
        <>
          {/* Filter / Search Bar */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '20px 24px',
            border: '1px solid #e2e8f0',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) auto auto', gap: '14px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Elastic Search (Name, City, Phone)
                </label>
                <input
                  type="text"
                  value={searchLastName}
                  onChange={(e) => setSearchLastName(e.target.value)}
                  placeholder="e.g. David Miller, Amanda, Austin..."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Date of Birth
                </label>
                <input
                  type="text"
                  value={searchDob}
                  onChange={(e) => setSearchDob(e.target.value)}
                  placeholder="MM/DD/YYYY"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="10 digits..."
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}>
                <input
                  type="checkbox"
                  id="include_del"
                  checked={includeDeleted}
                  onChange={(e) => setIncludeDeleted(e.target.checked)}
                  style={{ accentColor: '#2563eb', cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <label htmlFor="include_del" style={{ fontSize: '12.5px', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '500' }}>
                  Include Soft-Deleted
                </label>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#2563eb',
                    border: 'none',
                    color: '#ffffff',
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
                  <Search size={14} />
                  Filter
                </button>
                <button
                  type="button"
                  onClick={handleResetSearch}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

      {/* Patients Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px 28px',
        border: '1px solid #e2e8f0',
        overflowX: 'auto',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
            Registered Patients ({patients.length})
          </h3>
          <button
            onClick={handleResetSearch}
            disabled={loading}
            style={{
              padding: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '50%',
              color: loading ? '#2563eb' : '#64748b',
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
            title="Reload & refresh all patients"
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
          </button>
        </div>

        {patients.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <p style={{ fontSize: '15px', color: '#475569', marginBottom: '14px', fontWeight: '500' }}>
              No patient records found matching your filters.
            </p>
            <button
              onClick={handleResetSearch}
              style={{
                backgroundColor: '#2563eb',
                border: 'none',
                color: '#ffffff',
                padding: '9px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <RefreshCw size={14} />
              Reset Filters & Load All Patients
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>
                <th style={{ padding: '12px 14px' }}>Patient Name</th>
                <th style={{ padding: '12px 14px' }}>DOB / Sex</th>
                <th style={{ padding: '12px 14px' }}>Contact Phone</th>
                <th style={{ padding: '12px 14px' }}>Location</th>
                <th style={{ padding: '12px 14px' }}>Insurance</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => {
                const isDeleted = Boolean(p.deleted_at);
                return (
                  <tr
                    key={p.patient_id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.15s ease',
                      opacity: isDeleted ? 0.55 : 1
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>
                        {p.first_name} {p.last_name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#2563eb', fontWeight: '600' }}>
                          {p.patient_id.slice(0, 8)}...
                        </span>
                        <Copy
                          size={11}
                          color="#64748b"
                          style={{ cursor: 'pointer' }}
                          onClick={() => copyToClipboard(p.patient_id)}
                          title="Copy Full UUID"
                        />
                      </div>
                    </td>

                    <td style={{ padding: '14px', fontSize: '13px', color: '#334155' }}>
                      <div style={{ fontWeight: '600' }}>{p.date_of_birth}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>{p.sex}</div>
                    </td>

                    <td style={{ padding: '14px', fontSize: '13px', color: '#334155' }}>
                      <div style={{ fontWeight: '600' }}>
                        ({p.phone_number.slice(0, 3)}) {p.phone_number.slice(3, 6)}-{p.phone_number.slice(6)}
                      </div>
                      {p.email && <div style={{ fontSize: '11.5px', color: '#64748b' }}>{p.email}</div>}
                    </td>

                    <td style={{ padding: '14px', fontSize: '13px', color: '#334155' }}>
                      <div>{p.city}, {p.state} {p.zip_code}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>{p.address_line_1}</div>
                    </td>

                    <td style={{ padding: '14px', fontSize: '12.5px', color: '#334155' }}>
                      {p.insurance_provider ? (
                        <>
                          <div style={{ color: '#1d4ed8', fontWeight: '700' }}>{p.insurance_provider}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{p.insurance_member_id || 'No ID'}</div>
                        </>
                      ) : (
                        <span style={{ color: '#64748b', fontStyle: 'italic' }}>Self-Pay / None</span>
                      )}
                    </td>

                    <td style={{ padding: '14px' }}>
                      {isDeleted ? (
                        <span style={{
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          SOFT DELETED
                        </span>
                      ) : (
                        <span style={{
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          color: '#16a34a',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          ACTIVE
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => handleViewDetails(p)}
                          style={{
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#1d4ed8',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <FileText size={13} />
                          Details
                        </button>

                        {!isDeleted && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              style={{
                                backgroundColor: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                color: '#334155',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                              title="Edit patient"
                            >
                              <Edit3 size={13} />
                            </button>

                            <button
                              onClick={() => handleDeletePatient(p.patient_id)}
                              style={{
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#dc2626',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                              title="Soft delete record"
                            >
                              <Trash2 size={13} />
                            </button>

                            <button
                              onClick={() => handlePurgePatient(p.patient_id)}
                              style={{
                                backgroundColor: '#fee2e2',
                                border: '1px solid #fca5a5',
                                color: '#991b1b',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                              title="Permanently remove from database"
                            >
                              Purge
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
        </>
      ) : (
        /* Failures & Incomplete Registration View */
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px 28px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} color="#e11d48" />
                Real-Time Telephony Registration Failures & Incomplete Intakes ({failures.length})
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', margin: 0 }}>
                Live audit of calls that failed Pydantic validation or where the caller disconnected midway. Click <strong>"Fix & Register"</strong> to correct errors and register the patient into the EMR.
              </p>
            </div>
            <button
              onClick={() => fetchFailures()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} /> Refresh Failures
            </button>
          </div>

          {failures.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <CheckCircle2 size={40} color="#16a34a" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>All Intakes Complete & Validated</p>
              <p style={{ fontSize: '13px', margin: 0 }}>No failed or incomplete patient registration calls detected.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {failures.map((f) => {
                const isResolved = f.status === 'resolved';
                const p = f.parsed_payload || {};
                const hasPayload = Object.keys(p).length > 0;

                return (
                  <div
                    key={f.id}
                    style={{
                      border: isResolved ? '1px solid #bbf7d0' : '1px solid #fecaca',
                      borderRadius: '10px',
                      backgroundColor: isResolved ? '#fcfdfd' : '#fffbfb',
                      padding: '18px 20px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          backgroundColor: isResolved ? '#dcfce7' : (f.status === 'incomplete' ? '#fef3c7' : '#fee2e2'),
                          color: isResolved ? '#15803d' : (f.status === 'incomplete' ? '#b45309' : '#b91c1c'),
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px'
                        }}>
                          {isResolved ? 'Resolved' : (f.status === 'incomplete' ? 'Incomplete Intake' : 'Validation Error')}
                        </span>
                        <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                          {f.patient_name || 'Caller'}
                        </span>
                        {f.caller_phone && (
                          <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                            • {f.caller_phone}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {new Date(f.created_at).toLocaleString()}
                        </span>
                        {!isResolved && (
                          <button
                            onClick={() => handleOpenFix(f)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontSize: '12.5px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            <Edit3 size={14} />
                            Fix & Register Patient
                          </button>
                        )}
                        {!isResolved && (
                          <button
                            onClick={() => handleDismissFailure(f.id)}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              color: '#64748b',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Failure Reason Alert Box */}
                    <div style={{
                      backgroundColor: isResolved ? '#f0fdf4' : '#fef2f2',
                      border: isResolved ? '1px solid #bbf7d0' : '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}>
                      <AlertCircle size={16} color={isResolved ? '#16a34a' : '#dc2626'} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: isResolved ? '#166534' : '#991b1b', display: 'block' }}>
                          {isResolved ? 'Issue Resolved: Patient is now registered in EMR.' : f.failure_reason}
                        </span>
                        {f.call_sid && (
                          <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)', display: 'block', marginTop: '2px' }}>
                            Call SID: {f.call_sid} {f.duration_sec ? `(${f.duration_sec}s)` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Telephony Recording & Transcript Snippet */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: hasPayload ? '12px' : '0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <PhoneCall size={15} color="#2563eb" />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                          Telephony Session Audio:
                        </span>
                        {f.recording_url ? (
                          <audio controls src={f.recording_url.startsWith('http') ? f.recording_url : `${API_BASE}${f.recording_url}`} style={{ height: '30px', maxWidth: '280px' }} />
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Recording processing...</span>
                        )}
                      </div>

                      {f.duration_sec && (
                        <span style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> Call Duration: {f.duration_sec}s
                        </span>
                      )}
                    </div>

                    {/* Raw Captured Demographics (if any) */}
                    {hasPayload && (
                      <div style={{ marginTop: '10px', fontSize: '12px', color: '#475569' }}>
                        <span style={{ fontWeight: '700', display: 'block', marginBottom: '6px', fontSize: '11.5px', textTransform: 'uppercase', color: '#64748b' }}>
                          Captured Demographics from Caller:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {Object.entries(p).map(([k, v]) => {
                            if (!v || typeof v === 'object') return null;
                            return (
                              <span key={k} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px' }}>
                                <strong>{k.replace(/_/g, ' ')}:</strong> {String(v)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- MODAL 2: MANUAL PATIENT REGISTRATION FORM --- */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                Register New Patient
              </h3>
              <X size={20} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => setShowCreateModal(false)} />
            </div>

            {formError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>FIRST NAME *</label>
                <input required type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>LAST NAME *</label>
                <input required type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>DATE OF BIRTH (MM/DD/YYYY) *</label>
                <input required type="text" placeholder="MM/DD/YYYY" value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>SEX *</label>
                <select value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})} style={inputStyle}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Decline to Answer">Decline to Answer</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>U.S. PHONE (10 DIGITS) *</label>
                <input required type="text" placeholder="4155552671" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>EMAIL</label>
                <input type="email" placeholder="patient@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={inputStyle} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>STREET ADDRESS *</label>
                <input required type="text" placeholder="123 Market St" value={formData.address_line_1} onChange={e => setFormData({...formData, address_line_1: e.target.value})} style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>APT / SUITE / UNIT</label>
                <input type="text" placeholder="Apt 4B" value={formData.address_line_2} onChange={e => setFormData({...formData, address_line_2: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>CITY *</label>
                <input required type="text" placeholder="San Francisco" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>STATE (2-LETTER) *</label>
                <input required type="text" placeholder="CA" maxLength={2} value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>ZIP CODE (5 DIGITS) *</label>
                <input required type="text" placeholder="94105" value={formData.zip_code} onChange={e => setFormData({...formData, zip_code: e.target.value})} style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>INSURANCE PROVIDER</label>
                <input type="text" placeholder="Blue Cross" value={formData.insurance_provider} onChange={e => setFormData({...formData, insurance_provider: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>MEMBER ID</label>
                <input type="text" placeholder="BCBS12345" value={formData.insurance_member_id} onChange={e => setFormData({...formData, insurance_member_id: e.target.value})} style={inputStyle} />
              </div>

              <div style={{ gridColumn: 'span 2', marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '9px 18px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ padding: '9px 24px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                  {submitting ? 'Creating...' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: EDIT PATIENT --- */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                Edit Patient Record ({selectedPatient.first_name} {selectedPatient.last_name})
              </h3>
              <X size={20} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => setShowEditModal(false)} />
            </div>

            {formError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>FIRST NAME</label>
                <input type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>LAST NAME</label>
                <input type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>DATE OF BIRTH</label>
                <input type="text" value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>PHONE</label>
                <input type="text" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} style={inputStyle} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>STREET ADDRESS</label>
                <input type="text" value={formData.address_line_1} onChange={e => setFormData({...formData, address_line_1: e.target.value})} style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>CITY</label>
                <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>STATE</label>
                <input type="text" maxLength={2} value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>ZIP CODE</label>
                <input type="text" value={formData.zip_code} onChange={e => setFormData({...formData, zip_code: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>INSURANCE</label>
                <input type="text" value={formData.insurance_provider} onChange={e => setFormData({...formData, insurance_provider: e.target.value})} style={inputStyle} />
              </div>

              <div style={{ gridColumn: 'span 2', marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '9px 18px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ padding: '9px 24px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: PATIENT DETAILS & CALL TRANSCRIPTS --- */}
      {showDetailsModal && selectedPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </h3>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#2563eb', fontWeight: '700' }}>
                  UUID: {selectedPatient.patient_id}
                </span>
              </div>
              <X size={20} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => setShowDetailsModal(false)} />
            </div>

            {/* Demographics Card */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', marginBottom: '14px' }}>
                Complete Demographic Profile
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', fontWeight: '600' }}>DOB & SEX</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.date_of_birth} ({selectedPatient.sex})</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', fontWeight: '600' }}>PHONE NUMBER</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.phone_number}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', fontWeight: '600' }}>EMAIL</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.email || 'N/A'}</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', fontWeight: '600' }}>ADDRESS</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.address_line_1} {selectedPatient.address_line_2 || ''}, {selectedPatient.city}, {selectedPatient.state} {selectedPatient.zip_code}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', fontWeight: '600' }}>PREFERRED LANGUAGE</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.preferred_language || 'English'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', fontWeight: '600' }}>INSURANCE</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.insurance_provider ? `${selectedPatient.insurance_provider} (${selectedPatient.insurance_member_id})` : 'Self-Pay'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', fontWeight: '600' }}>EMERGENCY CONTACT</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPatient.emergency_contact_name || 'None'} {selectedPatient.emergency_contact_phone ? `(${selectedPatient.emergency_contact_phone})` : ''}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', fontWeight: '600' }}>CREATED AT</span>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>{new Date(selectedPatient.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Linked Calls & Transcripts */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', marginBottom: '12px' }}>
                Linked Call Transcripts & Sessions ({patientCalls.length})
              </h4>
              {patientCalls.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  No telephony call sessions linked to this patient ID yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {patientCalls.map((c) => (
                    <div key={c.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#2563eb', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>Call SID: {c.call_sid}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <pre style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '6px', fontSize: '12px', color: '#334155', whiteSpace: 'pre-wrap', maxHeight: '180px', overflowY: 'auto' }}>
                        {c.transcript}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: FIX & RESOLVE VALIDATION FAILURE MODAL --- */}
      {showFixModal && selectedFailure && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                  <AlertCircle size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Fix & Complete Patient Registration
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Correct validation errors and register directly into clinic database
                  </span>
                </div>
              </div>
              <X size={20} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => setShowFixModal(false)} />
            </div>

            {/* Failure Reason Banner */}
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#991b1b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Reported Issue:
              </span>
              <p style={{ fontSize: '13px', color: '#7f1d1d', margin: '0 0 6px 0', fontWeight: '600' }}>
                {selectedFailure.failure_reason}
              </p>
              {selectedFailure.caller_phone && (
                <span style={{ fontSize: '12px', color: '#b91c1c' }}>
                  Caller Number: <strong>{selectedFailure.caller_phone}</strong>
                </span>
              )}
            </div>

            {formError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleFixSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>FIRST NAME *</label>
                <input required type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>LAST NAME *</label>
                <input required type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>DATE OF BIRTH (MM/DD/YYYY) *</label>
                <input required type="text" placeholder="MM/DD/YYYY" value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>SEX *</label>
                <select value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})} style={inputStyle}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Decline to Answer">Decline to Answer</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>U.S. PHONE (10 DIGITS) *</label>
                <input required type="text" placeholder="5125550100" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>EMAIL</label>
                <input type="email" placeholder="patient@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={inputStyle} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>STREET ADDRESS *</label>
                <input required type="text" placeholder="104 Willow Lane" value={formData.address_line_1} onChange={e => setFormData({...formData, address_line_1: e.target.value})} style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>CITY *</label>
                <input required type="text" placeholder="Dallas" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>STATE *</label>
                  <input required type="text" placeholder="TX" maxLength="2" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>ZIP CODE *</label>
                  <input required type="text" placeholder="75201" value={formData.zip_code} onChange={e => setFormData({...formData, zip_code: e.target.value})} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>INSURANCE PROVIDER</label>
                <input type="text" placeholder="e.g. Aetna, Blue Cross" value={formData.insurance_provider} onChange={e => setFormData({...formData, insurance_provider: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>INSURANCE MEMBER ID</label>
                <input type="text" placeholder="e.g. AET-982144" value={formData.insurance_member_id} onChange={e => setFormData({...formData, insurance_member_id: e.target.value})} style={inputStyle} />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowFixModal(false)}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#2563eb',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px 22px',
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
                  {submitting ? 'Validating & Saving...' : 'Confirm & Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  backgroundColor: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  padding: '9px 12px',
  color: '#0f172a',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.15s ease'
};
