import React, { useState, useEffect } from 'react';
import {
  BookOpen, GraduationCap, Calendar, Clock, Megaphone, Settings,
  Search, Sparkles, CalendarDays, FileText, Users, ChevronRight,
  ArrowRight, Layers, Radio, MessageSquare, ShieldCheck, MapPin, Building2,
  TrendingUp, CheckCircle2, Bookmark
} from 'lucide-react';
import {
  getTeacherStats, getTeacherTimetable, getAnnouncements, 
  getTeacherModules, getMyUniversity
} from '../../api/services';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];

export default function TeacherOverview({ user, setActiveTab, conversations = [], unreadCount = 0, lastReadTime = 0 }) {
  const [stats, setStats] = useState({ modules: 0, sessions: 0, students: 0, exams: 0 });
  const [todaySlots, setTodaySlots] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [modules, setModules] = useState([]);
  const [university, setUniversity] = useState(null);

  useEffect(() => {
    getTeacherStats().then(r => setStats(r.data)).catch(console.error);
    getTeacherModules().then(r => setModules(r.data)).catch(console.error);
    getAnnouncements(0, 6).then(r => setAnnouncements(r.data)).catch(console.error);

    if (user?.university_id) {
      getMyUniversity().then(r => setUniversity(r.data)).catch(console.error);
    }

    getTeacherTimetable().then(r => {
      const today = new Date().getDay(); // 0=Sun
      const mapped = today <= 4 ? today : 0;
      const slots = (r.data || [])
        .filter(s => s.day_of_week === mapped)
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
      setTodaySlots(slots);
    }).catch(console.error);
  }, [user]);

  const nav = (tab) => { if (setActiveTab) setActiveTab(tab); };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Bonjour';
    if (hr < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const todayName = DAYS[new Date().getDay() <= 4 ? new Date().getDay() : 0];

  const SESSION_COLORS = {
    cours: { bg: 'from-blue-600 to-indigo-600', badge: 'bg-blue-50 text-blue-700 border-blue-200/60', iconColor: 'text-blue-600' },
    td: { bg: 'from-violet-600 to-purple-600', badge: 'bg-violet-50 text-violet-700 border-violet-200/60', iconColor: 'text-violet-600' },
    tp: { bg: 'from-amber-500 to-orange-600', badge: 'bg-amber-50 text-amber-700 border-amber-200/60', iconColor: 'text-amber-600' },
  };

  return (
    <div className="flex-1 overflow-y-auto min-h-screen p-6 md:p-10 relative bg-slate-50/60 font-sans text-slate-800">

      {/* Ambient background blur circles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-violet-200/40 blur-[120px]" />
        <div className="absolute top-1/3 left-10 w-80 h-80 rounded-full bg-blue-200/30 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">

        {/* ── HERO BANNER ── */}
        <div className="relative rounded-[32px] overflow-hidden p-8 md:p-10 shadow-xl border border-white/60 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          {/* Subtle background overlay pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.25),transparent_60%)]" />
          <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-violet-600/20 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md">
                  <ShieldCheck size={13} className="text-violet-400" /> Espace Professeur
                </span>
                {university?.name && (
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-300 text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-md">
                    <Building2 size={12} className="text-slate-400" /> {university.name}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-300 text-[10px] font-bold backdrop-blur-md">
                  {todayName}, {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                {getGreeting()}, <span className="bg-gradient-to-r from-violet-300 via-purple-200 to-white bg-clip-text text-transparent">{user?.first_name || 'Professeur'} {user?.last_name || ''}</span> 👋
              </h1>
              <p className="text-slate-300 text-sm max-w-xl font-medium leading-relaxed">
                Bienvenue sur votre tableau de bord. Retrouvez vos modules, vos cours, le calendrier de vos examens et vos interactions avec les étudiants.
              </p>
            </div>

            {/* Quick search & settings action */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64 bg-white/10 hover:bg-white/15 focus-within:bg-white/20 transition-all rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/15 backdrop-blur-xl">
                <Search size={17} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un module, un cours..."
                  className="bg-transparent border-none outline-none text-xs font-semibold text-white placeholder-slate-400 w-full"
                />
              </div>
              <button
                onClick={() => nav('settings')}
                className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-all backdrop-blur-xl shrink-0 shadow-sm"
                title="Paramètres"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Mes Modules', value: stats.modules, icon: <BookOpen size={20} />, color: 'from-violet-600 to-purple-600', tab: 'materials', bgTint: 'bg-violet-500/10 text-violet-600' },
            { label: 'Séances / Semaine', value: stats.sessions, icon: <CalendarDays size={20} />, color: 'from-blue-600 to-cyan-600', tab: 'timetable', bgTint: 'bg-blue-500/10 text-blue-600' },
            { label: 'Mes Étudiants', value: stats.students, icon: <GraduationCap size={20} />, color: 'from-emerald-600 to-teal-600', tab: 'students', bgTint: 'bg-emerald-500/10 text-emerald-600' },
            { label: 'Examens Programmés', value: stats.exams, icon: <FileText size={20} />, color: 'from-rose-600 to-pink-600', tab: 'exams', bgTint: 'bg-rose-500/10 text-rose-600' },
          ].map((s, i) => (
            <div
              key={i}
              onClick={() => nav(s.tab)}
              className="bg-white/80 backdrop-blur-xl rounded-[24px] p-6 shadow-sm border border-slate-200/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${s.color} opacity-[0.06] -translate-y-6 translate-x-6 group-hover:scale-150 transition-transform duration-500`} />
              
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                  {s.icon}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${s.bgTint} flex items-center gap-1`}>
                  Accéder <ChevronRight size={12} />
                </span>
              </div>

              <p className="text-3xl font-black text-slate-900 tracking-tight">{s.value}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

          {/* ── LEFT: TODAY + MODULES ── */}
          <div className="xl:col-span-8 space-y-8">

            {/* TODAY'S SCHEDULE */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-slate-200/60 p-6 md:p-7 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-violet-100/80 flex items-center justify-center text-[#7c3aed]">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">Programme du Jour</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">{todayName} — séances à enseigner</p>
                  </div>
                </div>
                <button
                  onClick={() => nav('timetable')}
                  className="text-xs font-black text-[#7c3aed] hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
                >
                  Voir l'emploi du temps <ChevronRight size={14} />
                </button>
              </div>

              {todaySlots.length === 0 ? (
                <div className="py-12 px-6 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center">
                  <Sparkles size={32} className="mx-auto mb-3 text-violet-400 animate-pulse" />
                  <p className="text-sm font-bold text-slate-700">Aucune séance prévue aujourd'hui</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Profitez de cette journée pour préparer vos prochains supports de cours ou consulter vos étudiants.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {todaySlots.map((slot, i) => {
                    const style = SESSION_COLORS[slot.session_type] || SESSION_COLORS.cours;
                    return (
                      <div
                        key={slot.id || i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:bg-white hover:border-violet-300 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          {/* Time tag */}
                          <div className="text-center shrink-0 w-20 py-2 px-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                            <p className="text-sm font-black text-slate-900">{slot.start_time?.slice(0, 5)}</p>
                            <p className="text-[10px] font-bold text-slate-400">{slot.end_time?.slice(0, 5)}</p>
                          </div>

                          {/* Info */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${style.badge}`}>
                                {slot.session_type === 'cours' ? 'Cours' : slot.session_type === 'td' ? 'Travaux Dirigés (TD)' : 'Travaux Pratiques (TP)'}
                              </span>
                              {slot.room && (
                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-200/50 px-2 py-0.5 rounded-full">
                                  <MapPin size={10} className="text-slate-400" /> {slot.room}
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-sm text-slate-900 group-hover:text-[#7c3aed] transition-colors">
                              {slot.module?.name || `Module #${slot.module_id}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => nav('materials')}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-violet-50 hover:text-[#7c3aed] hover:border-violet-200 transition-all shadow-xs"
                          >
                            Support de cours
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MY MODULES */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-slate-200/60 p-6 md:p-7 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100/80 flex items-center justify-center text-indigo-600">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">Mes Modules Enseignés</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">{modules.length} module(s) affecté(s)</p>
                  </div>
                </div>
                <button
                  onClick={() => nav('materials')}
                  className="text-xs font-black text-[#7c3aed] hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
                >
                  Gérer les documents <ChevronRight size={14} />
                </button>
              </div>

              {modules.length === 0 ? (
                <div className="py-12 text-center text-slate-400 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                  <BookOpen size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Aucun module assigné pour le moment.</p>
                  <p className="text-[10px] text-slate-400 mt-1">L'administration vous affectera vos modules via l'emploi du temps.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modules.map((m) => (
                    <div
                      key={m.id}
                      className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:border-violet-300 hover:bg-white hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                      onClick={() => nav('materials')}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-md group-hover:scale-110 transition-transform shrink-0">
                          {m.name?.[0]?.toUpperCase() || 'M'}
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200/60">
                          {m.level?.name || 'Niveau'}
                        </span>
                      </div>

                      <div className="space-y-1 mb-4">
                        <p className="font-black text-sm text-slate-900 group-hover:text-[#7c3aed] transition-colors leading-snug">
                          {m.name}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          {m.specialty?.name ? `${m.specialty.name} ` : ''}{m.semester?.name ? `· ${m.semester.name}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-xs font-bold text-[#7c3aed]">
                        <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Déposer support <ChevronRight size={13} />
                        </span>
                        <Bookmark size={14} className="text-slate-300 group-hover:text-violet-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="xl:col-span-4 space-y-6">

            {/* Quick Navigation Cards */}
            <div className="space-y-3.5">
              <div
                onClick={() => nav('timetable')}
                className="bg-white/80 backdrop-blur-xl rounded-[24px] p-5 flex items-center justify-between border border-slate-200/60 hover:border-violet-300 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 text-[#7c3aed] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Emploi du Temps</h4>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Consulter mon planning</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#7c3aed] group-hover:text-white transition-all">
                  <ChevronRight size={15} />
                </div>
              </div>

              <div
                onClick={() => nav('exams')}
                className="rounded-[24px] p-5 text-white flex items-center justify-between relative overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #e11d48 100%)' }}
              >
                <div className="flex items-center gap-4 z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xs group-hover:scale-110 transition-transform">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">Mes Examens</h4>
                    <p className="text-xs font-bold text-white/80 mt-0.5">{stats.exams} examen(s) programmé(s)</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:translate-x-1 transition-transform z-10">
                  <ArrowRight size={15} />
                </div>
              </div>
            </div>

            {/* CHAT / MESSAGERIE WIDGET */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-slate-200/60 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <MessageSquare size={17} className="text-[#7c3aed]" /> Messagerie
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse shadow-sm">
                    {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Unread messages list */}
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {conversations
                  .filter(c => {
                    if (c.role !== 'admin') return false;
                    if (c.last_message_sender === user?.id) return false;
                    if (!c.last_message) return false;
                    if (lastReadTime > 0 && c.last_message_date && new Date(c.last_message_date).getTime() <= lastReadTime) return false;
                    return true;
                  })
                  .slice(0, 4)
                  .map(c => (
                    <div
                      key={c.id}
                      onClick={() => nav('messages')}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-violet-50/70 border border-violet-100 hover:bg-violet-100/70 transition-all cursor-pointer"
                    >
                      <div className="relative shrink-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs text-white shadow-sm"
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #e11d48)' }}
                        >
                          {c.first_name?.[0]?.toUpperCase()}{c.last_name?.[0]?.toUpperCase()}
                        </div>
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{c.first_name} {c.last_name}</p>
                        <p className="text-xs text-violet-700 font-medium truncate">{c.last_message}</p>
                      </div>
                    </div>
                  ))}

                {conversations.filter(c => {
                    if (c.role !== 'admin') return false;
                    if (c.last_message_sender === user?.id) return false;
                    if (!c.last_message) return false;
                    if (lastReadTime > 0 && c.last_message_date && new Date(c.last_message_date).getTime() <= lastReadTime) return false;
                    return true;
                  }).length === 0 && (
                  <div className="py-6 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <MessageSquare size={24} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">Aucun nouveau message</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Toutes vos conversations sont à jour.</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => nav('messages')}
                className="mt-4 w-full bg-slate-50 hover:bg-[#7c3aed] hover:text-white text-[#7c3aed] font-bold text-xs py-3 rounded-2xl transition-all border border-slate-200 flex items-center justify-center gap-2 shadow-xs"
              >
                <MessageSquare size={15} /> Ouvrir la Messagerie
              </button>
            </div>

            {/* ANNOUNCEMENTS */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-slate-200/60 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Megaphone size={17} className="text-[#7c3aed]" /> Annonces Officielles
                </h3>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {announcements.slice(0, 5).map(ann => (
                  <div key={ann.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 hover:border-violet-200 transition-all">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="font-black text-xs text-slate-900 truncate">{ann.title}</p>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-violet-100 text-violet-700 shrink-0">
                        {ann.target === 'students' ? 'Étudiants' : ann.target === 'teachers' ? 'Profs' : 'Tous'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">{ann.content}</p>
                  </div>
                ))}

                {announcements.length === 0 && (
                  <div className="py-8 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Radio size={24} className="mx-auto mb-2 text-slate-300 animate-pulse" />
                    <p className="text-xs font-bold text-slate-600">Aucune annonce.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

