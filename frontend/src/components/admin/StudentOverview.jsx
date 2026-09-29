import React, { useState, useEffect } from 'react';
import {
  BookOpen, Calendar, FileText, Sparkles, Clock, ArrowRight,
  GraduationCap, Bot, CheckCircle2, Layers, Download
} from 'lucide-react';
import {
  getStudentInfo, getStudentModules, getStudentMaterials,
  getStudentTimetable, getStudentExams
} from '../../api/services';

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function StudentOverview({ user, setActiveTab, onSelectMaterialForAi }) {
  const [info, setInfo]           = useState(null);
  const [modules, setModules]     = useState([]);
  const [materials, setMaterials] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [exams, setExams]         = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getStudentInfo().catch(() => ({ data: null })),
      getStudentModules().catch(() => ({ data: [] })),
      getStudentMaterials().catch(() => ({ data: [] })),
      getStudentTimetable().catch(() => ({ data: [] })),
      getStudentExams().catch(() => ({ data: [] }))
    ]).then(([infoRes, modRes, matRes, timeRes, examRes]) => {
      setInfo(infoRes.data);
      setModules(modRes.data || []);
      setMaterials(matRes.data || []);
      setTimetable(timeRes.data || []);
      setExams(examRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const todayIndex = new Date().getDay(); // 0=Sunday
  const todaySlots = timetable.filter(s => s.day_of_week === todayIndex);
  const upcomingExams = exams.filter(e => new Date(e.exam_date + 'T00:00:00') >= new Date());

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-screen p-6 md:p-10 space-y-8 font-sans">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-violet-600">Espace Étudiant</span>
          <h1 className="text-2xl font-black text-slate-800">
            Bonjour, {user?.first_name || 'Étudiant'} 👋
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            Voici un aperçu de vos cours, révisions et emplois du temps.
          </p>
        </div>

        {/* Academic Card */}
        {info?.level && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">{info.level.name} — {info.specialty?.name}</p>
              <p className="text-[10px] font-bold text-slate-400">
                {info.section?.name} | {info.group?.name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Modules suivis', value: modules.length, from: 'from-violet-500', to: 'to-indigo-600', icon: <Layers size={18}/> },
          { label: 'Documents disponibles', value: materials.length, from: 'from-sky-500', to: 'to-blue-600', icon: <BookOpen size={18}/> },
          { label: 'Prochains examens', value: upcomingExams.length, from: 'from-rose-500', to: 'to-pink-600', icon: <FileText size={18}/> },
          { label: 'Cours aujourd\'hui', value: todaySlots.length, from: 'from-emerald-500', to: 'to-green-600', icon: <Calendar size={18}/> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center text-white shadow-md shrink-0`}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── AI Assistant Callout Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 rounded-[28px] p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 bg-violet-500/30 border border-violet-400/30 text-violet-200 text-[10px] font-black uppercase px-3 py-1 rounded-full">
              <Sparkles size={12} className="text-pink-400 animate-spin" /> Nouveau : Assistant IA Intégré
            </span>
            <h2 className="text-xl md:text-2xl font-black leading-tight">
              Réviser vos cours avec l'Intelligence Artificielle
            </h2>
            <p className="text-xs text-violet-200 leading-relaxed font-medium">
              Obtenez des résumés automatiques, des points clés à retenir, des quiz de révision et posez toutes vos questions sur vos supports de cours.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('chatbot')}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-pink-500/25 hover:scale-105 transition-all shrink-0"
          >
            <Bot size={18} /> Lancer l'Assistant IA <ArrowRight size={14} />
          </button>
        </div>

        {/* Decorative background blur glows */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl" />
      </div>

      {/* ── Grid: Today's Schedule + Recent Materials ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Today's Timetable */}
        <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Calendar size={18} className="text-violet-600" /> Mon Programme ({DAYS_FR[todayIndex]})
            </h3>
            <button onClick={() => setActiveTab('timetable')} className="text-xs font-bold text-violet-600 hover:underline">
              Voir tout
            </button>
          </div>

          {todaySlots.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Clock size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold">Aucune séance aujourd'hui !</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Profitez-en pour réviser avec l'IA.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySlots.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                      s.session_type === 'cours' ? 'bg-violet-100 text-violet-700' :
                      s.session_type === 'td' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {s.session_type}
                    </span>
                    <div>
                      <p className="text-xs font-black text-slate-800">{s.module?.name}</p>
                      <p className="text-[11px] font-medium text-slate-400">
                        {s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)} {s.room && `📍 ${s.room}`}
                      </p>
                    </div>
                  </div>
                  {s.teacher && (
                    <span className="text-[11px] font-bold text-slate-500">
                      {s.teacher.first_name} {s.teacher.last_name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Materials with AI Summary Trigger */}
        <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <BookOpen size={18} className="text-sky-600" /> Supports de Cours Récents
            </h3>
            <button onClick={() => setActiveTab('materials')} className="text-xs font-bold text-violet-600 hover:underline">
              Tous les documents
            </button>
          </div>

          {materials.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold">Aucun document publié pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {materials.slice(0, 4).map(m => (
                <div key={m.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs shrink-0">
                      📄
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">{m.title}</p>
                      <p className="text-[10px] font-medium text-slate-400">{m.module_name}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onSelectMaterialForAi) onSelectMaterialForAi(m.id);
                      setActiveTab('chatbot');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white text-[11px] font-bold rounded-xl shadow-sm transition-all"
                  >
                    <Sparkles size={11} /> Résumer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
