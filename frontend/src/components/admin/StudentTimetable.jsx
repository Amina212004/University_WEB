import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, MapPin, UserCircle } from 'lucide-react';
import { getStudentTimetable } from '../../api/services';

const DAYS = [
  { id: 0, label: 'Dimanche' },
  { id: 1, label: 'Lundi' },
  { id: 2, label: 'Mardi' },
  { id: 3, label: 'Mercredi' },
  { id: 4, label: 'Jeudi' },
];

export default function StudentTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    getStudentTimetable()
      .then(r => setTimetable(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-screen p-6 md:p-10 space-y-6 font-sans">
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-violet-600">Espace Étudiant</span>
        <h1 className="text-xl font-black text-slate-800">Mon Emploi du Temps</h1>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-400">Chargement de votre emploi du temps...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {DAYS.map(day => {
            const daySlots = timetable.filter(s => s.day_of_week === day.id);
            return (
              <div key={day.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col space-y-3">
                <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-black text-slate-800 text-sm">{day.label}</h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {daySlots.length} séance(s)
                  </span>
                </div>

                {daySlots.length === 0 ? (
                  <p className="text-xs text-slate-300 italic py-6 text-center">Repos</p>
                ) : (
                  daySlots.map(s => (
                    <div key={s.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 hover:bg-violet-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                          s.session_type === 'cours' ? 'bg-violet-100 text-violet-700' :
                          s.session_type === 'td' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {s.session_type}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)}
                        </span>
                      </div>

                      <p className="font-black text-slate-800 text-xs">{s.module?.name}</p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        {s.room && <span className="flex items-center gap-0.5">📍 {s.room}</span>}
                        {s.teacher && <span>Prof: {s.teacher.last_name}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
