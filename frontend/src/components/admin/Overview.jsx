import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, BookOpen, GraduationCap, Calendar, Plus, Megaphone, Trash2, 
  ChevronRight, Settings, Info, X, Clock, Sparkles, Command, Layers, 
  Radio, Activity, Search, MessageSquare, ArrowRight, CheckCircle2, Send
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { 
  getAdminStats, getAcademicTree, getUsers, getMyUniversity, 
  getAnnouncements, addAnnouncement, deleteAnnouncement,
  sendMessage, getChatHistory, getConversations
} from '../../api/services';

export default function Overview({ user, setActiveTab }) {
  const [stats, setStats]           = useState({ students: 0, teachers: 0, years: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [baseOtherUsers, setBaseOtherUsers] = useState([]);
  const [departments, setDepartments] = useState({});
  const [university, setUniversity]   = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [isAddOpen, setIsAddOpen]     = useState(false);
  const [newAnn, setNewAnn]           = useState({ title: '', content: '', target: 'all' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAnnTab, setActiveAnnTab] = useState('all');
  
  // Chat States
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMessages, setChatMessages]     = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSending, setIsSending]           = useState(false);
  
  // Custom states
  const [rightPanelTab, setRightPanelTab] = useState('activities'); // 'activities' or 'teachers'
  const messagesEndRef = useRef(null);
  
  // Notification Toast
  const [toastMessage, setToastMessage] = useState(null);
  const lastMsgTimeRef = useRef(0);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.university_id) {
          getMyUniversity().then(res => setUniversity(res.data)).catch(console.error);
          getAnnouncements(0, 10).then(res => setAnnouncements(res.data)).catch(console.error);
        }

        const [studentsRes, teachersRes, statsRes, treeRes, convRes] = await Promise.all([
          getUsers('student').catch(() => ({ data: [] })),
          getUsers('teacher').catch(() => ({ data: [] })),
          getAdminStats().catch(() => ({ data: { students: 0, teachers: 0, modules: 0 } })),
          getAcademicTree().catch(() => ({ data: [] })),
          getConversations().catch(() => ({ data: [] }))
        ]);

        setStats({
          students: statsRes.data.students ?? studentsRes.data.length,
          teachers: statsRes.data.teachers ?? teachersRes.data.length,
          years:    statsRes.data.modules   ?? 0
        });

        const conversations = convRes.data || [];
        const convIds = new Set(conversations.map(c => c.id));
        const otherU = [...studentsRes.data, ...teachersRes.data]
          .filter(u => !convIds.has(u.id))
          .sort((a, b) => b.id - a.id);
          
        setBaseOtherUsers([...studentsRes.data, ...teachersRes.data]);
        
        const recent = [...conversations, ...otherU].slice(0, 15);
        setRecentUsers(recent);

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

  // Poll conversations
  useEffect(() => {
    const pollConvs = () => {
      getConversations()
        .then(res => {
          const conversations = res.data || [];
          const convIds = new Set(conversations.map(c => c.id));
          const otherU = baseOtherUsers
            .filter(u => !convIds.has(u.id))
            .sort((a, b) => b.id - a.id);
          setRecentUsers([...conversations, ...otherU].slice(0, 15));
          
          // Check for new messages
          let latestTime = lastMsgTimeRef.current;
          let newMsgUser = null;
          let newMsgText = null;

          conversations.forEach(c => {
            if (c.last_message_date) {
              const time = new Date(c.last_message_date).getTime();
              if (time > latestTime && c.last_message_sender !== user?.id) {
                // If it's a newer message and it's not sent by me
                latestTime = time;
                newMsgUser = c;
                newMsgText = c.last_message;
              }
            }
          });

          // First time initialization
          if (!isInitializedRef.current) {
            isInitializedRef.current = true;
            lastMsgTimeRef.current = latestTime;
            return; 
          }

          if (latestTime > lastMsgTimeRef.current) {
            lastMsgTimeRef.current = latestTime;
            // Only show toast if the chat is not currently open with this user
            if (activeChatUser?.id !== newMsgUser?.id) {
              setToastMessage(`Nouveau message de ${newMsgUser.first_name} ${newMsgUser.last_name}: "${newMsgText}"`);
              setTimeout(() => setToastMessage(null), 5000);
            }
          }
        })
        .catch(console.error);
    };
    const interval = setInterval(pollConvs, 4000);
    return () => clearInterval(interval);
  }, [baseOtherUsers, activeChatUser, user]);

  // Message polling when chat is open
  useEffect(() => {
    if (!activeChatUser) return;

    const loadMessages = () => {
      getChatHistory(activeChatUser.id)
        .then(res => setChatMessages(res.data))
        .catch(console.error);
    };

    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [activeChatUser]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleOpenChat = (recipient) => {
    setActiveChatUser(recipient);
    setChatMessages([]);
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeChatUser) return;
    setIsSending(true);
    try {
      const res = await sendMessage({
        receiver_id: activeChatUser.id,
        content: newMessageText.trim()
      });
      setChatMessages(prev => [...prev, res.data]);
      setNewMessageText('');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi du message");
    } finally {
      setIsSending(false);
    }
  };

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
    { name: 'Mar', count: Math.round(stats.students * 0.70) || 28 },
    { name: 'Avr', count: Math.round(stats.students * 0.85) || 45 },
    { name: 'Mai', count: stats.students || 60 },
  ];

  return (
    <div className="flex-1 overflow-y-auto min-h-screen p-6 md:p-8 relative" style={{ background: '#f5f3ff' }}>
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed]">Console Administrateur</span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">Primary Dashboard</h2>
        </div>
        
        {/* Search bar & Admin Avatar */}
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

      {/* ── MAIN DASHBOARD MATRIX (Matching user mockup layout) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* MIDDLE & LEFT MAIN SECTION (9 cols) */}
        <div className="xl:col-span-9 space-y-8">
          
          {/* Top row: Large purple chart + stacked small side cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LARGE PURPLE CHART CARD (2/3 width) */}
            <div className="lg:col-span-2 rounded-[28px] text-white p-6 relative overflow-hidden flex flex-col justify-between h-[300px] shadow-sm"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}>
              
              <div className="flex justify-between items-start z-10">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-violet-200">Aperçu Global</h3>
                  <div className="text-2xl font-black mt-1">Activité Réseau</div>
                </div>
                
                {/* Custom tooltip styled box inside the card */}
                <div className="bg-slate-900/60 border border-white/10 backdrop-blur-md rounded-2xl px-3 py-1.5 text-right">
                  <div className="text-[9px] font-bold text-slate-350">Statistiques Récentes</div>
                  <div className="text-xs font-black text-white">{stats.students} Membres</div>
                </div>
              </div>

              {/* Area Chart inside Purple Card */}
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

              {/* Bottom statistics panel inside the card */}
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
              
              {/* Card A: Purple Horizontal Layout (Daily Jogging style) */}
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

              {/* Card B: Pink Gradient Waves Layout (My Jogging style) */}
              <div 
                onClick={() => nav('hierarchy')}
                className="rounded-[24px] p-5 text-white flex flex-col justify-between h-[156px] relative overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)' }}
              >
                {/* Floating Wave pattern inside pink card */}
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
            
            {/* Card 1: Students */}
            <div 
              onClick={() => nav('students')}
              className="bg-white rounded-[26px] p-6 pt-10 shadow-sm border border-slate-100/50 hover:shadow-md transition-all cursor-pointer relative group"
            >
              {/* Hanging badge top */}
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
              {/* Progress bar */}
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

            {/* Card 2: Teachers */}
            <div 
              onClick={() => nav('teachers')}
              className="bg-white rounded-[26px] p-6 pt-10 shadow-sm border border-slate-100/50 hover:shadow-md transition-all cursor-pointer relative group"
            >
              {/* Hanging badge top */}
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
              {/* Progress bar */}
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

            {/* Card 3: Timetable sessions */}
            <div 
              onClick={() => nav('timetable')}
              className="bg-white rounded-[26px] p-6 pt-10 shadow-sm border border-slate-100/50 hover:shadow-md transition-all cursor-pointer relative group"
            >
              {/* Hanging badge top */}
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
              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Taux de couverture</span>
                  <span>73%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: '73%' }} />
                </div>
              </div>
            </div>

          </div>

          {/* Announcements block (replacing activities feed for announcement management) */}
          <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-sm text-slate-800">Actualités & Annonces</h3>
                <p className="text-[10px] font-bold text-slate-400">Diffusion communautaire</p>
              </div>
              <button
                onClick={() => setIsAddOpen(true)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
              >
                <Plus size={13} /> Publier
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {announcements.slice(0, 4).map(ann => (
                <div key={ann.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3 relative group transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-[#7c3aed] transition-colors shrink-0">
                    <Megaphone size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-800 truncate">{ann.title}</div>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{ann.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded text-[8px] font-black bg-violet-100 text-violet-850">
                        {ann.target === 'students' ? '🎓 Étudiants' : ann.target === 'teachers' ? '👨‍🏫 Profs' : '🌐 Tous'}
                      </span>
                    </div>
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

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-white border-l-4 border-[#7c3aed] shadow-lg rounded-xl p-4 flex items-center gap-3 animate-fade-in-up z-50 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <MessageSquare size={18} className="text-[#7c3aed]" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-800">Nouveau message</p>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="ml-auto p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
              <X size={14} />
            </button>
          </div>
        )}

        {/* RIGHT SIDEBAR PANEL (3 cols) - "Friends" style with messaging triggers */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Members list (Friends List mock layout) */}
          <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-sm text-slate-800">Messagerie Directe</h3>
              <span className="text-[9px] font-black px-2 py-1 rounded-full bg-purple-50 text-[#7c3aed] border border-purple-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-ping" />
                Dispo
              </span>
            </div>

            {/* Toggle buttons matching mock */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
              <button 
                onClick={() => setRightPanelTab('activities')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${rightPanelTab === 'activities' ? 'bg-white text-slate-850 shadow-sm' : 'text-slate-400'}`}
              >
                Tout le monde
              </button>
              <button 
                onClick={() => setRightPanelTab('teachers')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${rightPanelTab === 'teachers' ? 'bg-white text-slate-850 shadow-sm' : 'text-slate-400'}`}
              >
                Enseignants
              </button>
            </div>

            {/* List triggers Chat Drawer */}
            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
              {recentUsers
                .filter(u => rightPanelTab === 'activities' ? true : u.role === 'teacher')
                .map((u, i) => (
                  <div 
                    key={u.id} 
                    onClick={() => handleOpenChat(u)}
                    className="flex items-center justify-between group cursor-pointer p-2 rounded-xl hover:bg-violet-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs text-white shadow-sm border border-slate-200"
                          style={{ background: u.role === 'teacher' ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'linear-gradient(135deg,#5c4df1,#7c3aed)' }}
                        >
                          {u.first_name?.[0]?.toUpperCase()}{u.last_name?.[0]?.toUpperCase()}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-850 leading-tight group-hover:text-[#7c3aed] transition-colors">
                          {u.first_name} {u.last_name}
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 mt-0.5 truncate max-w-[110px]">{u.email}</div>
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-slate-50 hover:bg-[#7c3aed]/10 text-slate-400 hover:text-[#7c3aed] flex items-center justify-center transition-colors">
                      <MessageSquare size={13} />
                    </button>
                  </div>
                ))}
              
              {recentUsers.length === 0 && (
                <div className="py-12 text-center text-slate-400">Aucun membre actif</div>
              )}
            </div>
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
          </div>

        </div>

      </div>

      {/* ── CHAT SLIDE-OVER DRAWER (Futuristic slide in messager) ── */}
      {activeChatUser && (
        <>
          {/* Backdrop mask */}
          <div 
            onClick={() => setActiveChatUser(null)} 
            className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm transition-opacity" 
          />
          
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl border-l border-slate-100 flex flex-col transition-all duration-300 transform translate-x-0">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white shadow-sm border border-slate-200"
                  style={{ background: activeChatUser.role === 'teacher' ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'linear-gradient(135deg,#5c4df1,#7c3aed)' }}
                >
                  {activeChatUser.first_name?.[0]?.toUpperCase()}{activeChatUser.last_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800">{activeChatUser.first_name} {activeChatUser.last_name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    activeChatUser.role === 'admin' ? 'bg-rose-100 text-rose-700' :
                    activeChatUser.role === 'teacher' ? 'bg-purple-100 text-purple-700' : 
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {activeChatUser.role === 'admin' ? 'Administration' : activeChatUser.role === 'teacher' ? 'Professeur' : 'Étudiant'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setActiveChatUser(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {chatMessages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-[20px] px-4 py-2.5 text-xs font-medium leading-relaxed shadow-sm ${
                      isMe 
                        ? 'bg-[#7c3aed] text-white rounded-tr-sm' 
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                    }`}>
                      <div>{msg.content}</div>
                      <div className={`text-[8px] mt-1 text-right ${isMe ? 'text-violet-200' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <MessageSquare size={36} className="text-slate-300 mb-2 animate-bounce" />
                  <p className="text-xs font-bold">Aucun message. Envoyez le premier !</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input footer */}
            <form onSubmit={handleSendChat} className="p-4 border-t border-slate-100 bg-white flex gap-2">
              <input 
                type="text" 
                value={newMessageText}
                onChange={e => setNewMessageText(e.target.value)}
                placeholder="Tapez votre message ici..."
                className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-[#7c3aed] border border-transparent transition-all"
              />
              <button 
                type="submit"
                disabled={isSending || !newMessageText.trim()}
                className="w-10 h-10 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white flex items-center justify-center shadow-md shadow-violet-200 shrink-0 transition-colors"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </>
      )}

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
