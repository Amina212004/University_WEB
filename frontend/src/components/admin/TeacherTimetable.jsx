import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, Download, Sparkles, MapPin, Layers, FileSpreadsheet } from 'lucide-react';
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
  cours: { bg: 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white', badge: 'bg-white/20 text-white border-white/20', label: 'Cours' },
  td:    { bg: 'bg-gradient-to-br from-violet-600 to-purple-600 text-white', badge: 'bg-white/20 text-white border-white/20', label: 'TD' },
  tp:    { bg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white', badge: 'bg-white/20 text-white border-white/20', label: 'TP' },
};

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h - 8) * 60 + m;
}

function SessionCard({ slot }) {
  const style = SESSION_STYLES[slot.session_type] || SESSION_STYLES.cours;
  const top = (timeToMinutes(slot.start_time?.slice(0,5)) / 30) * 64;
  const height = Math.max(((timeToMinutes(slot.end_time?.slice(0,5)) - timeToMinutes(slot.start_time?.slice(0,5))) / 30) * 64 - 6, 46);

  return (
    <div
      className={`absolute left-1.5 right-1.5 rounded-2xl shadow-lg border border-white/20 overflow-hidden z-10 ${style.bg} transition-all hover:scale-[1.02] hover:z-20`}
      style={{ top: `${top + 3}px`, height: `${height}px` }}
    >
      <div className="p-3 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border backdrop-blur-md ${style.badge}`}>
              {style.label}
            </span>
            {slot.room && (
              <span className="text-[9px] font-bold text-white/90 flex items-center gap-0.5">
                <MapPin size={10} /> {slot.room}
              </span>
            )}
          </div>
          <p className="font-black text-xs leading-snug line-clamp-2 drop-shadow-xs">
            {slot.module?.name || `Module #${slot.module_id}`}
          </p>
        </div>
        <div className="pt-1 border-t border-white/15 flex items-center justify-between text-[10px] font-bold text-white/80">
          <span className="flex items-center gap-1">
            <Clock size={10} /> {slot.start_time?.slice(0,5)} – {slot.end_time?.slice(0,5)}
          </span>
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
    doc.text('Mon Emploi du Temps — Espace Professeur', 40, 40);
    doc.setFontSize(10);
    let y = 70;
    DAYS.forEach((day, di) => {
      const daySlots = slotsByDay[di];
      if (daySlots.length === 0) return;
      doc.setFontSize(12);
      doc.text(day, 40, y); y += 18;
      doc.setFontSize(9);
      daySlots.forEach(slot => {
        const line = `${slot.start_time?.slice(0,5)} - ${slot.end_time?.slice(0,5)}  |  ${slot.module?.name || 'Module'}  |  ${(slot.session_type || '').toUpperCase()}  |  ${slot.room || 'Sans salle'}`;
        doc.text(line, 60, y); y += 14;
      });
      y += 8;
    });
    doc.save('emploi_du_temps_enseignant.pdf');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/60 min-h-screen font-sans text-slate-800">
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 md:px-10 py-5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed]">Espace Enseignant</span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mon Emploi du Temps</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-2xl transition-all shadow-xs"
          >
            <Download size={15} /> Exporter PDF
          </button>
        </div>
      </div>

      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        
        {/* Stats summary row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {[
            { label: 'Total Séances', value: totalSessions, color: 'border-violet-200 bg-violet-500/10 text-violet-700', icon: <CalendarDays size={18} /> },
            { label: 'Cours Magistraux', value: coursCount, color: 'border-blue-200 bg-blue-500/10 text-blue-700', icon: <Layers size={18} /> },
            { label: 'Travaux Dirigés (TD)', value: tdCount, color: 'border-purple-200 bg-purple-500/10 text-purple-700', icon: <FileSpreadsheet size={18} /> },
            { label: 'Travaux Pratiques (TP)', value: tpCount, color: 'border-amber-200 bg-amber-500/10 text-amber-700', icon: <Sparkles size={18} /> },
          ].map((s, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/60 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{s.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${s.color}`}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Grid Container */}
        {loading ? (
          <div className="text-center py-24 bg-white/80 backdrop-blur-xl rounded-[28px] border border-slate-200/60 shadow-xs">
            <div className="w-10 h-10 border-4 border-violet-200 border-t-[#7c3aed] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">Chargement de votre emploi du temps...</p>
          </div>
        ) : timeslots.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-slate-200/60 p-12 text-center shadow-xs">
            <Sparkles size={40} className="mx-auto mb-3 text-violet-400 animate-pulse" />
            <h3 className="text-base font-black text-slate-900">Aucune séance programmée</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Vous n'avez pas de séance d'enseignement affectée pour l'instant dans la grille globale.</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200/60 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">Grille Hebdomadaire des Cours</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Semaine académique (Dimanche à Jeudi)</p>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid border-b border-slate-200/60 bg-slate-50/50" style={{ gridTemplateColumns: '80px repeat(5, 1fr)' }}>
              <div className="p-4 border-r border-slate-200/60 flex items-center justify-center">
                <Clock size={18} className="text-slate-400" />
              </div>
              {DAYS.map((day, i) => {
                const isToday = new Date().getDay() === i;
                return (
                  <div key={day} className={`p-4 text-center border-r border-slate-200/60 last:border-r-0 ${isToday ? 'bg-violet-50/80' : ''}`}>
                    <p className={`text-xs font-black uppercase tracking-wider ${isToday ? 'text-[#7c3aed]' : 'text-slate-600'}`}>
                      <span className="hidden md:inline">{day}</span>
                      <span className="md:hidden">{DAYS_SHORT[i]}</span>
                    </p>
                    {isToday && (
                      <span className="inline-block mt-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#7c3aed] text-white">
                        Aujourd'hui
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="flex overflow-x-auto">
              <div className="flex-shrink-0 w-20 border-r border-slate-200/60 bg-slate-50/30">
                {TIME_SLOTS.map(t => (
                  <div key={t} className="flex items-start justify-end pr-3 border-b border-slate-100" style={{ height: '64px' }}>
                    <span className={`text-[11px] font-bold mt-1.5 ${t.endsWith(':00') ? 'text-slate-500' : 'text-slate-200'}`}>
                      {t.endsWith(':00') ? t : ''}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex-1 grid min-w-[600px]" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {DAYS.map((day, di) => {
                  const isToday = new Date().getDay() === di;
                  return (
                    <div key={day} className={`relative border-r border-slate-200/60 last:border-r-0 ${isToday ? 'bg-violet-50/20' : ''}`} style={{ height: `${GRID_HEIGHT}px` }}>
                      {TIME_SLOTS.map((t, i) => (
                        <div
                          key={t}
                          className={`absolute w-full ${t.endsWith(':00') ? 'border-b border-slate-200/60' : 'border-b border-slate-100'}`}
                          style={{ top: `${i * 64}px`, height: '64px' }}
                        />
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

