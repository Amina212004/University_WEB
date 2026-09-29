import React, { useState, useEffect } from 'react';
import { getStudentExams } from '../../api/services';

const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
const DAYS_FR   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

function getCountdown(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((examDate - today) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return { text: 'Passé', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
  if (diff === 0) return { text: "Aujourd'hui !", color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
  if (diff === 1) return { text: 'Demain', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
  if (diff <= 7)  return { text: `Dans ${diff} jours`, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  if (diff <= 30) return { text: `Dans ${diff} jours`, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
  return { text: `Dans ${diff} jours`, color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
}

export default function StudentExams() {
  const [exams, setExams]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('upcoming'); // 'all' | 'upcoming' | 'past'

  useEffect(() => {
    getStudentExams()
      .then(r => setExams(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = exams.filter(e => new Date(e.exam_date + 'T00:00:00') >= today);
  const past     = exams.filter(e => new Date(e.exam_date + 'T00:00:00') <  today);
  const displayed = filter === 'upcoming' ? upcoming : filter === 'past' ? past : exams;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', fontFamily: "'Inter', sans-serif", color: '#e2e8f0', background: 'transparent' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8b5cf6', marginBottom: '0.3rem' }}>
          Espace Étudiant
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          📅 Planning de mes Examens
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.4rem', fontSize: '0.88rem' }}>
          Dates fixées par l'administration · {upcoming.length} examen(s) à venir
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { key: 'upcoming', label: `🔔 À venir (${upcoming.length})` },
          { key: 'past',     label: `✅ Passés (${past.length})` },
          { key: 'all',      label: `📋 Tous (${exams.length})` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '0.5rem 1.2rem', borderRadius: '10px', border: 'none',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              background: filter === f.key ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)',
              color: filter === f.key ? '#fff' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Chargement des examens...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <p style={{ fontWeight: 700, color: '#475569', fontSize: '1rem' }}>
            {filter === 'upcoming' ? 'Aucun examen à venir' : filter === 'past' ? 'Aucun examen passé' : 'Aucun examen programmé'}
          </p>
          <p style={{ color: '#334155', fontSize: '0.82rem', marginTop: '0.4rem' }}>
            Les examens apparaîtront ici dès qu'ils sont planifiés par l'administration
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '860px' }}>
          {displayed.map(exam => {
            const d        = new Date(exam.exam_date + 'T00:00:00');
            const day      = d.getDate();
            const month    = MONTHS_FR[d.getMonth()];
            const year     = d.getFullYear();
            const dayName  = DAYS_FR[d.getDay()] || '';
            const isPast   = d < today;
            const hasFile  = !!exam.exam_file_url;
            const cd       = getCountdown(exam.exam_date);

            return (
              <div
                key={exam.id}
                style={{
                  background: isPast ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isPast ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.2)'}`,
                  borderRadius: '16px',
                  padding: '1.3rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  opacity: isPast ? 0.65 : 1,
                  transition: 'all 0.2s',
                  boxShadow: isPast ? 'none' : '0 4px 24px rgba(99,102,241,0.06)',
                }}
              >
                {/* Date Badge */}
                <div style={{
                  flexShrink: 0, width: '70px', height: '70px', borderRadius: '16px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: isPast
                    ? 'rgba(148,163,184,0.15)'
                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: isPast ? 'none' : '0 6px 20px rgba(99,102,241,0.35)',
                  color: '#fff',
                }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.85 }}>
                    {dayName.slice(0, 3)}
                  </span>
                  <span style={{ fontSize: '1.7rem', fontWeight: 900, lineHeight: 1 }}>{day}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.85 }}>{month} {year}</span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Countdown badge */}
                  <div style={{ marginBottom: '0.4rem' }}>
                    <span style={{
                      padding: '0.2rem 0.7rem', borderRadius: '6px',
                      background: cd.bg, color: cd.color,
                      fontSize: '0.75rem', fontWeight: 700,
                    }}>
                      {cd.text}
                    </span>
                  </div>

                  {/* Module */}
                  <p style={{ fontWeight: 800, color: '#e2e8f0', fontSize: '1rem', margin: '0 0 0.4rem' }}>
                    {exam.module?.name || `Module #${exam.module_id}`}
                  </p>

                  {/* Details */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.82rem', color: '#64748b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                      🕐 {exam.start_time?.slice(0, 5)} – {exam.end_time?.slice(0, 5)}
                    </span>
                    {exam.room && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                        📍 {exam.room}
                      </span>
                    )}
                    {exam.level && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, color: '#8b5cf6' }}>
                        🎓 {exam.level.name}
                      </span>
                    )}
                  </div>

                  {/* Download subject if available */}
                  {hasFile && (
                    <div style={{ marginTop: '0.7rem' }}>
                      <a
                        href={`http://localhost:8000${exam.exam_file_url}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.4rem 0.9rem', borderRadius: '8px',
                          background: 'rgba(16,185,129,0.12)', color: '#10b981',
                          border: '1px solid rgba(16,185,129,0.25)',
                          fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none',
                          transition: 'background 0.2s',
                        }}
                      >
                        📥 Sujet d'examen disponible — Télécharger
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
