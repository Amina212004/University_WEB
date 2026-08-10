import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, Trash2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { getTeacherTimetable } from '../../api/services';
import jsPDF from 'jspdf';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];
const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu'];
const TIME_SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00'
];

const SESSION_STYLES = {
  cours: { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', badge: 'bg-blue-100 text-blue-700', label: 'Cours' },
  td:    { bg: 'bg-gradient-to-br from-violet-500 to-violet-600', badge: 'bg-violet-100 text-violet-700', label: 'TD' },
  tp:    { bg: 'bg-gradient-to-br from-amber-500 to-orange-500', badge: 'bg-amber-100 text-amber-700', label: 'TP' },
};

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h - 8) * 60 + m;
}

function SessionCard({ slot }) {
  const style = SESSION_STYLES[slot.session_type] || SESSION_STYLES.cours;
  const top = (timeToMinutes(slot.start_time?.slice(0,5)) / 30) * 64;
  const height = Math.max(((timeToMinutes(slot.end_time?.slice(0,5)) - timeToMinutes(slot.start_time?.slice(0,5))) / 30) * 64 - 4, 40);

  return (
    <div className={`absolute left-1 right-1 rounded-2xl shadow-md overflow-hidden z-10 ${style.bg}`}
      style={{ top: `${top}px`, height: `${height}px` }}>
      <div className="p-2 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1 mb-0.5 flex-wrap">
            <span className="text-[10px] font-black uppercase bg-white/20 text-white px-1.5 py-0.5 rounded-full">{style.label}</span>
          </div>
          <p className="font-bold text-xs text-white leading-tight truncate">{slot.module?.name || `Module #${slot.module_id}`}</p>
        </div>
        <div>
          <p className="text-[10px] text-white/70">{slot.start_time?.slice(0,5)} – {slot.end_time?.slice(0,5)}{slot.room && ` · ${slot.room}`}</p>
        </div>
      </div>
    </div>
  );
}

export default function TeacherTimetable() {
  const [timeslots, setTimeslots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTeacherTimetable()
      .then(r => setTimeslots(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const slotsByDay = DAYS.map((_, i) => timeslots.filter(s => s.day_of_week === i));
  const GRID_HEIGHT = TIME_SLOTS.length * 64;
  const totalSessions = timeslots.length;
  const coursCount = timeslots.filter(s => s.session_type === 'cours').length;
  const tdCount = timeslots.filter(s => s.session_type === 'td').length;
  const tpCount = timeslots.filter(s => s.session_type === 'tp').length;

  const exportPDF = () => {
    const doc = new jsPDF('landscape', 'pt', 'a4');
    doc.setFontSize(16);
    doc.text('Mon Emploi du Temps', 40, 40);
    doc.setFontSize(10);
    let y = 70;
    DAYS.forEach((day, di) => {
      const daySlots = slotsByDay[di];
      if (daySlots.length === 0) return;
      doc.setFontSize(12);
      doc.text(day, 40, y); y += 18;
      doc.setFontSize(9);
      daySlots.forEach(slot => {
        const line = `${slot.start_time?.slice(0,5)} - ${slot.end_time?.slice(0,5)}  |  ${slot.module?.name || 'Module'}  |  ${(slot.session_type || '').toUpperCase()}  |  ${slot.room || ''}`;
        doc.text(line, 60, y); y += 14;
      });
      y += 8;
    });
    doc.save('mon_emploi_du_temps.pdf');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 md:px-10 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed]">Espace Enseignant</span>
          <h1 className="text-xl font-black text-slate-800">Mon Emploi du Temps</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-brand-700 bg-brand-50 border border-brand-200 rounded-xl hover:bg-brand-100 transition-all shadow-sm">
            Exporter PDF
          </button>
        </div>
      </div>

      <div className="px-6 md:px-10 py-6 space-y-6">
        {/* Stats mini */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Séances', value: totalSessions, color: 'text-violet-600 bg-violet-50' },
            { label: 'Cours', value: coursCount, color: 'text-blue-600 bg-blue-50' },
            { label: 'TD', value: tdCount, color: 'text-purple-600 bg-purple-50' },
            { label: 'TP', value: tpCount, color: 'text-amber-600 bg-amber-50' },
          ].map((s, i) => (
            <div key={i} className={`rounded-2xl p-4 border border-slate-100 ${s.color}`}>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-violet-300 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-400">Chargement de votre emploi du temps...</p>
          </div>
        ) : timeslots.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-slate-100 p-12 text-center shadow-sm">
            <Sparkles size={36} className="mx-auto mb-3 text-slate-300 animate-pulse" />
            <p className="text-sm font-bold text-slate-500">Aucune séance programmée pour vous.</p>
            <p className="text-xs text-slate-400 mt-1">Contactez l'administration pour être assigné à des modules.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-800">Grille Hebdomadaire</h2>
            </div>
            {/* Day Headers */}
            <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: '80px repeat(5, 1fr)' }}>
              <div className="p-4 border-r border-slate-100 flex items-center justify-center"><Clock size={16} className="text-slate-200" /></div>
              {DAYS.map((day, i) => {
                const isToday = new Date().getDay() === i;
                return (
                  <div key={day} className={`p-4 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-brand-50' : ''}`}>
                    <p className={`text-xs font-black uppercase tracking-wider ${isToday ? 'text-brand-600' : 'text-slate-400'}`}>
                      <span className="hidden md:inline">{day}</span>
                      <span className="md:hidden">{DAYS_SHORT[i]}</span>
                    </p>
                    {isToday && <span className="text-[8px] font-bold text-brand-500">AUJOURD'HUI</span>}
                  </div>
                );
              })}
            </div>
            {/* Time Grid */}
            <div className="flex">
              <div className="flex-shrink-0 w-20 border-r border-slate-100">
                {TIME_SLOTS.map(t => (
                  <div key={t} className="flex items-start justify-end pr-3 border-b border-slate-50" style={{ height: '64px' }}>
                    <span className={`text-xs font-bold mt-1.5 ${t.endsWith(':00') ? 'text-slate-400' : 'text-slate-100'}`}>
                      {t.endsWith(':00') ? t : ''}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex-1 grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {DAYS.map((day, di) => {
                  const isToday = new Date().getDay() === di;
                  return (
                    <div key={day} className={`relative border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-brand-50/20' : ''}`} style={{ height: `${GRID_HEIGHT}px` }}>
                      {TIME_SLOTS.map((t, i) => (
                        <div key={t} className={`absolute w-full ${t.endsWith(':00') ? 'border-b border-slate-100' : 'border-b border-slate-50'}`} style={{ top: `${i * 64}px`, height: '64px' }} />
                      ))}
                      {slotsByDay[di].map(slot => (
                        <SessionCard key={slot.id} slot={slot} />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
