import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneCall, 
  Play, 
  Pause, 
  RefreshCw, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  FileText,
  AlertCircle
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:8080' : window.location.origin);

export default function CallsView() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  
  // Audio playback state & refs for strict idempotency
  const [playingCallSid, setPlayingCallSid] = useState(null);
  const [loadingAudioCallSid, setLoadingAudioCallSid] = useState(null);
  const loadingSidRef = useRef(null);
  const audioRef = useRef(null);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/calls`);
      const data = await res.json();
      setCalls(data.calls || []);
    } catch (err) {
      console.error('Failed to fetch calls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  // Cleanup active audio on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const handleSyncVapi = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      const res = await fetch(`${API_BASE}/api/vapi/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setSyncMessage({ type: 'success', text: data.data.message });
        fetchCalls();
      } else {
        setSyncMessage({ type: 'error', text: data.error || 'Failed to sync with Vapi' });
      }
    } catch (e) {
      setSyncMessage({ type: 'error', text: e.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleAudio = async (callSid) => {
    // 1. Strict Idempotency: If any audio is already loading, ignore spam clicks immediately
    if (loadingSidRef.current) {
      return;
    }

    // 2. If this call is currently playing, clicking pauses and unloads it
    if (playingCallSid === callSid) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      setPlayingCallSid(null);
      setLoadingAudioCallSid(null);
      loadingSidRef.current = null;
      return;
    }

    // 3. Stop and unload any previously playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setPlayingCallSid(null);

    // 4. Mark as loading synchronously to block rapid subsequent clicks
    loadingSidRef.current = callSid;
    setLoadingAudioCallSid(callSid);

    try {
      const fullUrl = `${API_BASE}/api/vapi/recording/${callSid}`;
      const audio = new Audio();
      audio.preload = 'auto';
      audioRef.current = audio;

      audio.onended = () => {
        if (audioRef.current === audio) {
          setPlayingCallSid(null);
          setLoadingAudioCallSid(null);
          loadingSidRef.current = null;
          audioRef.current = null;
        }
      };

      audio.onerror = (e) => {
        console.warn('Audio playback error:', e);
        if (audioRef.current === audio) {
          setLoadingAudioCallSid(null);
          setPlayingCallSid(null);
          loadingSidRef.current = null;
          audioRef.current = null;
        }
      };

      audio.onplaying = () => {
        if (audioRef.current === audio) {
          setLoadingAudioCallSid(null);
          loadingSidRef.current = null;
          setPlayingCallSid(callSid);
        }
      };

      audio.onwaiting = () => {
        if (audioRef.current === audio) {
          setLoadingAudioCallSid(callSid);
        }
      };

      audio.src = fullUrl;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (audioRef.current === audio) {
              setLoadingAudioCallSid(null);
              loadingSidRef.current = null;
              setPlayingCallSid(callSid);
            }
          })
          .catch((err) => {
            console.warn('Playback prevented or interrupted:', err);
            if (audioRef.current === audio) {
              setLoadingAudioCallSid(null);
              setPlayingCallSid(null);
              loadingSidRef.current = null;
              audioRef.current = null;
            }
          });
      }
    } catch (err) {
      console.warn('Audio setup error:', err);
      setLoadingAudioCallSid(null);
      setPlayingCallSid(null);
      loadingSidRef.current = null;
      audioRef.current = null;
    }
  };

  return (
    <div>
      {/* Header & Vapi Sync Bar */}
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
            Telephony Calls & Audio Recordings
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Real-time verified call transcripts and mono recordings from inbound clinic telephony line
          </p>
        </div>

        {/* Sync from Vapi button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleSyncVapi}
            disabled={syncing}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: syncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <RefreshCw size={14} className={syncing ? 'spin-icon' : ''} />
            {syncing ? 'Syncing...' : 'Sync from Vapi'}
          </button>
        </div>
      </div>

      {syncMessage && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '18px',
          fontSize: '13px',
          backgroundColor: syncMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: syncMessage.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
          color: syncMessage.type === 'success' ? '#166534' : '#dc2626',
          fontWeight: '600'
        }}>
          {syncMessage.text}
        </div>
      )}

      {/* Calls List */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={22} className="spin-icon" style={{ margin: '0 auto 10px auto', display: 'block', color: '#2563eb' }} />
          Loading telephony calls...
        </div>
      ) : calls.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px dashed #cbd5e1',
          borderRadius: '12px',
          padding: '60px 24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <PhoneCall size={44} color="#94a3b8" style={{ margin: '0 auto 16px auto', display: 'block' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            No Telephony Calls Recorded Yet
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '520px', margin: '0 auto 20px auto', lineHeight: '1.5' }}>
            Pick up your phone and dial the clinic's inbound telephony line to speak with Sarah.
            Your conversation and audio recording will appear here automatically!
          </p>
          <button
            onClick={fetchCalls}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#2563eb',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Refresh Calls
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {calls.map((call) => {
            const isPlaying = playingCallSid === call.call_sid;
            const isLoadingAudio = loadingAudioCallSid === call.call_sid;
            return (
              <div
                key={call.call_sid || call.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: isPlaying ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb'
                    }}>
                      <PhoneCall size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                        {call.caller_phone || 'Inbound Caller'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        SID: {call.call_sid}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {call.duration_sec > 0 && (
                      <span style={{ fontSize: '12.5px', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} color="#64748b" />
                        {Math.floor(call.duration_sec / 60)}m {Math.floor(call.duration_sec % 60)}s
                      </span>
                    )}

                    {call.cost > 0 && (
                      <span style={{ fontSize: '12.5px', color: '#16a34a', fontWeight: '700' }}>
                        ${Number(call.cost).toFixed(2)}
                      </span>
                    )}

                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {call.created_at}
                    </span>

                    {/* Audio Player Button with True Idempotency & Buffering State */}
                    <button
                      onClick={() => handleToggleAudio(call.call_sid)}
                      disabled={Boolean(loadingAudioCallSid)}
                      style={{
                        backgroundColor: isPlaying
                          ? '#eff6ff'
                          : isLoadingAudio
                            ? '#fffbeb'
                            : '#ffffff',
                        border: isPlaying
                          ? '1px solid #2563eb'
                          : isLoadingAudio
                            ? '1px solid #d97706'
                            : '1px solid #cbd5e1',
                        color: isPlaying ? '#2563eb' : isLoadingAudio ? '#d97706' : '#1e293b',
                        borderRadius: '8px',
                        padding: '7px 16px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: isLoadingAudio ? 'wait' : Boolean(loadingAudioCallSid) ? 'not-allowed' : 'pointer',
                        opacity: (Boolean(loadingAudioCallSid) && !isLoadingAudio) ? 0.45 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isLoadingAudio ? (
                        <>
                          <RefreshCw size={13} className="spin-icon" />
                          Loading Audio...
                        </>
                      ) : isPlaying ? (
                        <>
                          <Pause size={14} />
                          Pause Audio
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
                            <span className="audio-bar" />
                            <span className="audio-bar" />
                            <span className="audio-bar" />
                          </div>
                        </>
                      ) : (
                        <>
                          <Play size={14} color="#2563eb" fill="#2563eb" />
                          Play Recording
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Transcript */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  fontSize: '13px',
                  color: '#334155',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {call.transcript || 'No transcript text available for this call.'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
