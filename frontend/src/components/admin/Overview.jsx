import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, BookOpen, GraduationCap, Calendar, Plus, Megaphone, Trash2, 
  ChevronRight, Settings, Info, X, Clock, Sparkles, Command, Layers, 
  Radio, Activity, Search, MessageSquare, ArrowRight, CheckCircle2, Send, Bell
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import {
  getAdminStats, getAcademicTree, getUsers, getMyUniversity, 
  getAnnouncements, addAnnouncement, deleteAnnouncement
} from '../../api/services';

export default function Overview({ user, setActiveTab, conversations = [], unreadCount = 0, lastReadTime = 0 }) {
  const [stats, setStats]           = useState({ students: 0, teachers: 0, years: 0 });
  const [departments, setDepartments] = useState({});
  const [university, setUniversity]   = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [isAddOpen, setIsAddOpen]     = useState(false);
  const [newAnn, setNewAnn]           = useState({ title: '', content: '', target: 'all' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAnnTab, setActiveAnnTab] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.university_id) {
          getMyUniversity().then(res => setUniversity(res.data)).catch(console.error);
          getAnnouncements(0, 10).then(res => setAnnouncements(res.data)).catch(console.error);
        }

        const [studentsRes, teachersRes, statsRes, treeRes] = await Promise.all([
          getUsers('student').catch(() => ({ data: [] })),
          getUsers('teacher').catch(() => ({ data: [] })),
          getAdminStats().catch(() => ({ data: { students: 0, teachers: 0, modules: 0 } })),
          getAcademicTree().catch(() => ({ data: [] }))
        ]);

        setStats({
          students: statsRes.data.students ?? studentsRes.data.length,
          teachers: statsRes.data.teachers ?? teachersRes.data.length,
          years:    statsRes.data.modules   ?? 0
        });

        const grouped = {};
        (treeRes.data || []).forEach(faculty => {
          (faculty.departments || []).forEach(dept => {
            grouped[dept.name] = (dept.specialties || []).flatMap(s =>
              (s.levels || []).map(l => l.name)
            );
          });
        });
        setDepartments(grouped);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, [user]);

  const handleAddAnn = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addAnnouncement(newAnn);
      const res = await getAnnouncements(0, 10);
      setAnnouncements(res.data);
      setIsAddOpen(false);
      setNewAnn({ title: '', content: '', target: 'all' });
    } catch { alert('Erreur lors de la publication'); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteAnn = async (id) => {
    if (!window.confirm('Supprimer cette annonce ?')) return;
    try {
      await deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch { alert('Erreur de suppression'); }
  };

  const nav = (tab) => { if (setActiveTab) setActiveTab(tab); };

  const filteredAnnouncements = announcements.filter(ann => {
    if (activeAnnTab === 'all') return true;
    return ann.target === activeAnnTab;
  });

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const chartData = [
    { name: 'Jan', count: Math.round(stats.students * 0.45) || 12 },
    { name: 'Fév', count: Math.round(stats.students * 0.52) || 18 },
    { name: 'Mar', count: Math.round(stats.students * 0.62) || 25 },
    { name: 'Avr', count: Math.round(stats.students * 0.71) || 32 },
    { name: 'Mai', count: Math.round(stats.students * 0.80) || 40 },
    { name: 'Jun', count: Math.round(stats.students * 0.90) || 47 },
    { name: 'Jul', count: stats.students || 55 },
  ];

  const unreadConvs = conversations.filter(c => {
    if (c.role !== 'teacher') return false;
    if (c.last_message_sender === user?.id) return false;
    if (!c.last_message) return false;
    if (lastReadTime > 0 && c.last_message_date && new Date(c.last_message_date).getTime() <= lastReadTime) return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto min-h-screen p-6 md:p-8 relative" style={{ background: '#f5f3ff' }}>

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed]">Administration</span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
            {getGreeting()}, {user?.first_name || 'Admin'} 👋
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">{university?.name || 'Université'}</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 bg-white/80 rounded-full px-4 py-2 flex items-center gap-2 border border-slate-200/50 shadow-sm">
            <Search size={16} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-full placeholder-slate-450"
            />
          </div>
          <button 
            onClick={() => nav('settings')}
            className="w-10 h-10 rounded-full bg-white/80 border border-slate-200/40 flex items-center justify-center text-slate-500 hover:text-[#7c3aed] transition-colors shadow-sm shrink-0"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* ── MAIN DASHBOARD MATRIX ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* MIDDLE & LEFT MAIN SECTION (9 cols) */}
        <div className="xl:col-span-9 space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LARGE PURPLE CHART CARD (2/3 width) */}
            <div className="lg:col-span-2 rounded-[28px] text-white p-6 relative overflow-hidden flex flex-col justify-between h-[300px] shadow-sm"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}>
              
              <div className="flex justify-between items-start z-10">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-violet-200">Aperçu Global</h3>
                  <div className="text-2xl font-black mt-1">Activité Réseau</div>
                </div>
                
                <div className="bg-slate-900/60 border border-white/10 backdrop-blur-md rounded-2xl px-3 py-1.5 text-right">
                  <div className="text-[9px] font-bold text-slate-350">Statistiques Récentes</div>
                  <div className="text-xs font-black text-white">{stats.students} Membres</div>
                </div>
              </div>

              <div className="h-32 w-full mt-2 z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255,255,255,0.4)" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ background: '#1e1b4b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px' }} 
                      itemStyle={{ color: '#a78bfa' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#ffffff" 
                      strokeWidth={2.5} 
                      fill="rgba(255,255,255,0.12)" 
                      dot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#7c3aed' }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center z-10">
                <div>
                  <div className="text-[9px] font-bold text-violet-200 uppercase">Étudiants</div>
                  <div className="text-base font-black text-white">{stats.students}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-violet-200 uppercase">Professeurs</div>
                  <div className="text-base font-black text-white">{stats.teachers}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-violet-200 uppercase">Modules</div>
                  <div className="text-base font-black text-white">{stats.years}</div>
                </div>
              </div>
            </div>

            {/* TWO SMALLER STACKED SIDE CARDS (1/3 width) */}
            <div className="flex flex-col gap-6">
              <div 
                onClick={() => nav('timetable')}
                className="bg-violet-100 rounded-[24px] p-5 flex items-center justify-between border border-violet-200/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-[#7c3aed] shadow-sm group-hover:scale-110 transition-transform">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-violet-950 uppercase tracking-wider">Planification</h4>
                    <p className="text-xs font-bold text-violet-600 mt-0.5">Emplois du temps</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#7c3aed] shadow-sm">
                  <ChevronRight size={16} />
                </div>
              </div>

              <div 
                onClick={() => nav('hierarchy')}
                className="rounded-[24px] p-5 text-white flex flex-col justify-between h-[156px] relative overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)' }}
              >
                <svg className="absolute bottom-0 left-0 right-0 w-full h-16 pointer-events-none opacity-25" viewBox="0 0 1440 320" preserveAspectRatio="none">
                  <path fill="#ffffff" d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,224C672,213,768,171,864,149.3C960,128,1056,128,1152,138.7C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
                </svg>

                <div className="flex justify-between items-start z-10">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-violet-100">Filières</span>
                    <h4 className="text-lg font-black mt-0.5 leading-none">Structure</h4>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <Layers size={14} />
                  </div>
                </div>

                <div className="flex justify-between items-end z-10 mt-auto">
                  <div>
                    <span className="text-[10px] font-black text-violet-100 block">Modules Totaux</span>
                    <span className="text-xl font-extrabold leading-none">{stats.years}</span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white text-[#7c3aed] flex items-center justify-center shadow-sm">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW: 3 WHITE CARDS WITH HANGING BADGES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div 
              onClick={() => nav('students')}
              className="bg-white rounded-[26px] p-6 pt-10 shadow-sm border border-slate-100/50 hover:shadow-md transition-all cursor-pointer relative group"
            >
              <div className="absolute top-0 left-6 -translate-y-1/2 w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                <GraduationCap size={18} />
              </div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Étudiants</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">Inscriptions validées</p>
                </div>
                <div className="text-2xl font-black text-slate-800">{stats.students}</div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Taux de présence</span>
                  <span>85%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
            </div>

            <div 
              onClick={() => nav('teachers')}
              className="bg-white rounded-[26px] p-6 pt-10 shadow-sm border border-slate-100/50 hover:shadow-md transition-all cursor-pointer relative group"
            >
              <div className="absolute top-0 left-6 -translate-y-1/2 w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #9333ea, #a855f7)' }}>
                <Users size={18} />
              </div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Professeurs</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">Membres actifs</p>
                </div>
                <div className="text-2xl font-black text-slate-800">{stats.teachers}</div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Disponibilité</span>
                  <span>92%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#7c3aed] rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
            </div>

            <div 
              onClick={() => nav('timetable')}
              className="bg-white rounded-[26px] p-6 pt-10 shadow-sm border border-slate-100/50 hover:shadow-md transition-all cursor-pointer relative group"
            >
              <div className="absolute top-0 left-6 -translate-y-1/2 w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #5c4df1, #7c3aed)' }}>
                <BookOpen size={18} />
              </div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Séances</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">Modules et horaires</p>
                </div>
                <div className="text-2xl font-black text-slate-800">40h/sem</div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Taux de couverture</span>
                  <span>78%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#5c4df1] rounded-full" style={{ width: '78%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Announcements block */}
          <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                  <Megaphone size={16} className="text-[#7c3aed]" /> Annonces
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Communication université</p>
              </div>
              <button 
                onClick={() => setIsAddOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] text-white shadow-md hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
              >
                <Plus size={14} /> Nouvelle
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
              {[['all','Toutes'],['students','Étudiants'],['teachers','Profs']].map(([val, label]) => (
                <button key={val} onClick={() => setActiveAnnTab(val)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeAnnTab === val ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
              {filteredAnnouncements.map(ann => (
                <div key={ann.id} className="group relative p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-violet-200 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Megaphone size={11} className="text-slate-400 shrink-0" />
                    <p className="font-bold text-[11px] text-slate-800 truncate">{ann.title}</p>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{ann.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded text-[8px] font-black bg-violet-100 text-violet-850">
                      {ann.target === 'students' ? '🎓 Étudiants' : ann.target === 'teachers' ? '👨‍🏫 Profs' : '🌐 Tous'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteAnn(ann.id)}
                    className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 text-slate-350 hover:text-rose-500 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="col-span-2 py-12 text-center text-slate-400">
                  <Radio size={24} className="mx-auto mb-2 opacity-30 animate-pulse" />
                  <p className="text-xs font-bold">Aucune annonce récente.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT SIDEBAR PANEL (3 cols) */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Messagerie / Notifications */}
          <div className="bg-white rounded-[28px] border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                <MessageSquare size={16} className="text-[#7c3aed]" /> Messagerie
              </h3>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                  {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {unreadConvs.length === 0 ? (
                <div className="py-4 text-center">
                  <MessageSquare size={24} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-[11px] font-bold text-slate-400">Aucun nouveau message</p>
                </div>
              ) : (
                unreadConvs.slice(0, 5).map(c => (
                  <div
                    key={c.id}
                    onClick={() => nav('messages')}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-violet-50 border border-violet-100 hover:bg-violet-100 transition-colors cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-[10px] text-white shadow-sm"
                           style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                        {c.first_name?.[0]?.toUpperCase()}{c.last_name?.[0]?.toUpperCase()}
                      </div>
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-500 border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[11px] text-slate-800 truncate">{c.first_name} {c.last_name}</p>
                      <p className="text-[10px] text-violet-600 font-medium truncate">{c.last_message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => nav('messages')}
              className="w-full bg-slate-50 hover:bg-[#7c3aed]/10 text-[#7c3aed] font-bold text-xs py-2.5 rounded-xl transition-colors border border-slate-100 flex items-center justify-center gap-2"
            >
              <MessageSquare size={13} />
              Ouvrir la Messagerie
            </button>
          </div>

          {/* Campus Info Widget */}
          <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-4 overflow-hidden relative">
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5">
              <Command size={14} className="text-[#7c3aed]" /> Info Établissement
            </h3>
            
            <div className="rounded-2xl p-4 bg-slate-50 border border-slate-100 text-xs font-bold text-slate-650 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Nom</span>
                <span className="text-slate-700">{university?.name || "Université"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Domaine</span>
                <span className="text-[#7c3aed] font-mono">{university?.subdomain || university?.domain || "univ"}.univ.edu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Statut</span>
                <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12} /> Validé</span>
              </div>
            </div>

            {Object.entries(departments).length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Départements</p>
                {Object.entries(departments).slice(0, 3).map(([dept, levels]) => (
                  <div key={dept} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-[11px] font-bold text-slate-700 truncate">{dept}</span>
                    <span className="text-[9px] font-black text-[#7c3aed] bg-violet-50 px-2 py-0.5 rounded-full shrink-0 ml-2">{levels.length} niv.</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => nav('hierarchy')}
              className="w-full text-center text-[10px] font-black text-[#7c3aed] hover:underline flex items-center justify-center gap-1"
            >
              Gérer la structure <ChevronRight size={12} />
            </button>
          </div>
        </div>

      </div>

      {/* Add Announcement Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100">
              <h2 className="text-lg font-black flex items-center gap-2 text-slate-800">
                <Megaphone size={18} className="text-[#7c3aed]" /> Publier une annonce
              </h2>
              <button 
                onClick={() => setIsAddOpen(false)} 
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
            
            <form onSubmit={handleAddAnn} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Titre</label>
                <input 
                  required 
                  type="text" 
                  value={newAnn.title}
                  onChange={e => setNewAnn({ ...newAnn, title: e.target.value })}
                  placeholder="Ex: Session de formation..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-[#7c3aed] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Contenu</label>
                <textarea 
                  required 
                  rows={4} 
                  value={newAnn.content}
                  onChange={e => setNewAnn({ ...newAnn, content: e.target.value })}
                  placeholder="Écrivez votre message..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-600 outline-none focus:bg-white focus:border-[#7c3aed] transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Destinataires</label>
                <select 
                  value={newAnn.target}
                  onChange={e => setNewAnn({ ...newAnn, target: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-[#7c3aed] transition-all"
                >
                  <option value="all">🌐 Tout le monde</option>
                  <option value="students">🎓 Étudiants uniquement</option>
                  <option value="teachers">👨‍🏫 Professeurs uniquement</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-7 py-2.5 rounded-xl font-bold text-xs text-white transition-all hover:opacity-90 disabled:opacity-50 shadow-md shadow-brand-500/25"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
                >
                  {isSubmitting ? 'Publication...' : 'Publier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
