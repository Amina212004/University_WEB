import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, GraduationCap, Calendar, Clock, Megaphone, Settings,
  Search, Sparkles, CalendarDays, FileText, Users, ChevronRight,
  ArrowRight, Layers, Radio, MessageSquare, X, Send
} from 'lucide-react';
import { 
  getTeacherStats, getTeacherTimetable, getAnnouncements, 
  getTeacherModules, getMyUniversity, getConversations, 
  getChatHistory, sendMessage 
} from '../../api/services';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];

export default function TeacherOverview({ user, setActiveTab }) {
  const [stats, setStats] = useState({ modules: 0, sessions: 0, students: 0, exams: 0 });
  const [todaySlots, setTodaySlots] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [modules, setModules] = useState([]);
  const [university, setUniversity] = useState(null);
  
  // Chat States
  const [conversations, setConversations] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState(null);
  const lastMsgTimeRef = useRef(0);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    getTeacherStats().then(r => setStats(r.data)).catch(console.error);
    getTeacherModules().then(r => setModules(r.data)).catch(console.error);
    getAnnouncements(0, 6).then(r => setAnnouncements(r.data)).catch(console.error);
    
    const loadConvs = () => {
      getConversations()
        .then(r => {
          const newConvs = r.data || [];
          setConversations(newConvs);

          // Check for new messages
          let latestTime = lastMsgTimeRef.current;
          let newMsgUser = null;
          let newMsgText = null;

          newConvs.forEach(c => {
            if (c.last_message_date) {
              const time = new Date(c.last_message_date).getTime();
              if (time > latestTime && c.last_message_sender !== user?.id) {
                latestTime = time;
                newMsgUser = c;
                newMsgText = c.last_message;
              }
            }
          });

          if (!isInitializedRef.current) {
            isInitializedRef.current = true;
            lastMsgTimeRef.current = latestTime;
            return;
          }

          if (latestTime > lastMsgTimeRef.current) {
            lastMsgTimeRef.current = latestTime;
            if (activeChatUser?.id !== newMsgUser?.id) {
              setToastMessage(`Nouveau message de ${newMsgUser.first_name} ${newMsgUser.last_name}: "${newMsgText}"`);
              setTimeout(() => setToastMessage(null), 5000);
            }
          }
        })
        .catch(console.error);
    };
    loadConvs();
    const convInterval = setInterval(loadConvs, 4000);

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
    return () => {
      clearInterval(convInterval);
    };
  }, [user]);

  // Chat polling
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const nav = (tab) => { if (setActiveTab) setActiveTab(tab); };

  const handleOpenChat = (u) => {
    setActiveChatUser(u);
    setChatMessages([]);
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeChatUser) return;
    setIsSending(true);
    try {
      const res = await sendMessage({ receiver_id: activeChatUser.id, content: newMessageText });
      setChatMessages(prev => [...prev, res.data]);
      setNewMessageText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Bonjour';
    if (hr < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const todayName = DAYS[new Date().getDay() <= 4 ? new Date().getDay() : 0];

  const SESSION_COLORS = {
    cours: { bg: 'from-blue-500 to-blue-600', badge: 'bg-blue-100 text-blue-700' },
    td: { bg: 'from-violet-500 to-violet-600', badge: 'bg-violet-100 text-violet-700' },
    tp: { bg: 'from-amber-500 to-orange-500', badge: 'bg-amber-100 text-amber-700' },
  };

  return (
    <div className="flex-1 overflow-y-auto min-h-screen p-6 md:p-8 relative" style={{ background: '#f5f3ff' }}>

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed]">Espace Enseignant</span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
            {getGreeting()}, {user?.first_name || 'Professeur'} 👋
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">{university?.name || 'Université'} · {todayName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-56 bg-white/80 rounded-full px-4 py-2 flex items-center gap-2 border border-slate-200/50 shadow-sm">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Rechercher..." className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-full placeholder-slate-400" />
          </div>
          <button onClick={() => nav('settings')} className="w-10 h-10 rounded-full bg-white/80 border border-slate-200/40 flex items-center justify-center text-slate-500 hover:text-[#7c3aed] transition-colors shadow-sm shrink-0">
            <Settings size={18} />
          </button>
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

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Mes Modules', value: stats.modules, icon: <BookOpen size={18} />, color: 'from-violet-500 to-purple-600', tab: 'materials' },
          { label: 'Séances / Sem.', value: stats.sessions, icon: <CalendarDays size={18} />, color: 'from-blue-500 to-cyan-500', tab: 'timetable' },
          { label: 'Mes Étudiants', value: stats.students, icon: <GraduationCap size={18} />, color: 'from-emerald-500 to-teal-500', tab: 'students' },
          { label: 'Examens', value: stats.exams, icon: <FileText size={18} />, color: 'from-rose-500 to-pink-500', tab: 'exams' },
        ].map((s, i) => (
          <div key={i} onClick={() => nav(s.tab)} className="bg-white rounded-[22px] p-5 shadow-sm border border-slate-100/50 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br ${s.color} opacity-[0.07] -translate-y-4 translate-x-4 group-hover:scale-150 transition-transform duration-500`} />
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-md mb-3`}>
              {s.icon}
            </div>
            <p className="text-2xl font-black text-slate-800">{s.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* ── LEFT: TODAY + MODULES ── */}
        <div className="xl:col-span-8 space-y-8">

          {/* TODAY'S SCHEDULE */}
          <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                  <Clock size={16} className="text-[#7c3aed]" /> Programme du jour
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{todayName} — {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <button onClick={() => nav('timetable')} className="text-[10px] font-black text-[#7c3aed] hover:underline flex items-center gap-1">
                Voir tout <ChevronRight size={12} />
              </button>
            </div>

            {todaySlots.length === 0 ? (
              <div className="py-10 text-center">
                <Sparkles size={28} className="mx-auto mb-2 text-slate-300 animate-pulse" />
                <p className="text-xs font-bold text-slate-400">Aucune séance prévue aujourd'hui.</p>
                <p className="text-[10px] text-slate-300 mt-1">Profitez-en pour préparer vos cours !</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySlots.map((slot, i) => {
                  const style = SESSION_COLORS[slot.session_type] || SESSION_COLORS.cours;
                  return (
                    <div key={slot.id || i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-violet-50/30 transition-colors group">
                      {/* Time */}
                      <div className="text-center shrink-0 w-16">
                        <p className="text-sm font-black text-slate-800">{slot.start_time?.slice(0, 5)}</p>
                        <p className="text-[10px] font-bold text-slate-300">{slot.end_time?.slice(0, 5)}</p>
                      </div>
                      {/* Divider */}
                      <div className={`w-1 h-12 rounded-full bg-gradient-to-b ${style.bg}`} />
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${style.badge}`}>
                            {slot.session_type === 'cours' ? 'Cours' : slot.session_type === 'td' ? 'TD' : 'TP'}
                          </span>
                          {slot.room && <span className="text-[9px] font-bold text-slate-400">📍 {slot.room}</span>}
                        </div>
                        <p className="font-bold text-xs text-slate-800 truncate">{slot.module?.name || `Module #${slot.module_id}`}</p>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-[#7c3aed] transition-colors shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MY MODULES */}
          <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                  <Layers size={16} className="text-[#7c3aed]" /> Mes Modules
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{modules.length} module(s) assigné(s)</p>
              </div>
              <button onClick={() => nav('materials')} className="text-[10px] font-black text-[#7c3aed] hover:underline flex items-center gap-1">
                Gérer les docs <ChevronRight size={12} />
              </button>
            </div>

            {modules.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <BookOpen size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold">Aucun module assigné pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {modules.map((m, i) => (
                  <div key={m.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all cursor-pointer group" onClick={() => nav('materials')}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-sm`}>
                        {m.name?.[0]?.toUpperCase() || 'M'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-slate-800 truncate group-hover:text-[#7c3aed] transition-colors">{m.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {m.level?.name || ''} {m.specialty?.name ? `· ${m.specialty.name}` : ''} {m.semester?.name ? `· ${m.semester.name}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="xl:col-span-4 space-y-6">

          {/* Quick Actions */}
          <div className="space-y-3">
            <div onClick={() => nav('timetable')} className="bg-violet-100 rounded-[22px] p-5 flex items-center justify-between border border-violet-200/50 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#7c3aed] shadow-sm group-hover:scale-110 transition-transform"><CalendarDays size={18} /></div>
                <div>
                  <h4 className="text-xs font-black text-violet-950 uppercase tracking-wider">Emploi du Temps</h4>
                  <p className="text-[10px] font-bold text-violet-600 mt-0.5">Ma semaine</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#7c3aed] shadow-sm"><ChevronRight size={14} /></div>
            </div>

            <div onClick={() => nav('exams')} className="rounded-[22px] p-5 text-white flex items-center justify-between relative overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)' }}>
              <div className="flex items-center gap-3 z-10">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform"><FileText size={18} /></div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white/90">Mes Examens</h4>
                  <p className="text-[10px] font-bold text-white/70 mt-0.5">{stats.exams} programmé(s)</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shadow-sm z-10"><ArrowRight size={14} /></div>
            </div>
          </div>

          {/* CHAT / MESSAGERIE WIDGET */}
          <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                <MessageSquare size={16} className="text-[#7c3aed]" /> Messagerie
              </h3>
            </div>
            
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {conversations.map(u => (
                <div 
                  key={u.id} 
                  onClick={() => handleOpenChat(u)}
                  className="flex items-center justify-between group cursor-pointer p-2 rounded-xl hover:bg-violet-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-[10px] text-white shadow-sm border border-slate-200"
                         style={{ background: u.role === 'admin' ? 'linear-gradient(135deg,#f43f5e,#fb923c)' : 'linear-gradient(135deg,#5c4df1,#7c3aed)' }}>
                      {u.first_name?.[0]?.toUpperCase()}{u.last_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-[11px] text-slate-850 group-hover:text-[#7c3aed] transition-colors">
                        {u.first_name} {u.last_name}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 mt-0.5">{u.role === 'admin' ? 'Administration' : 'Étudiant / Prof'}</div>
                    </div>
                  </div>
                  <button className="w-7 h-7 rounded-full bg-slate-50 hover:bg-[#7c3aed]/10 text-slate-400 hover:text-[#7c3aed] flex items-center justify-center transition-colors">
                    <ChevronRight size={12} />
                  </button>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="py-4 text-center text-slate-400">
                  <p className="text-xs font-bold">Aucune conversation.</p>
                </div>
              )}
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 mb-4">
              <Megaphone size={16} className="text-[#7c3aed]" /> Annonces
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {announcements.slice(0, 5).map(ann => (
                <div key={ann.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Megaphone size={11} className="text-slate-400 shrink-0" />
                    <p className="font-bold text-[11px] text-slate-800 truncate">{ann.title}</p>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{ann.content}</p>
                  <span className="mt-1.5 inline-block px-2 py-0.5 rounded text-[8px] font-black bg-violet-100 text-violet-700">
                    {ann.target === 'students' ? '🎓 Étudiants' : ann.target === 'teachers' ? '👨‍🏫 Profs' : '🌐 Tous'}
                  </span>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="py-8 text-center text-slate-400">
                  <Radio size={24} className="mx-auto mb-2 opacity-30 animate-pulse" />
                  <p className="text-xs font-bold">Aucune annonce.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CHAT DRAWER ── */}
      {activeChatUser && (
        <>
          <div 
            onClick={() => setActiveChatUser(null)} 
            className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm transition-opacity" 
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl border-l border-slate-100 flex flex-col transition-transform transform translate-x-0">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white shadow-sm border border-slate-200"
                  style={{ background: activeChatUser.role === 'admin' ? 'linear-gradient(135deg,#f43f5e,#fb923c)' : 'linear-gradient(135deg,#5c4df1,#7c3aed)' }}
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

            {/* Input footer */}
            <form onSubmit={handleSendChat} className="p-4 border-t border-slate-100 bg-white flex gap-2">
              <input 
                type="text" 
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Écrire un message..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#7c3aed] transition-colors"
              />
              <button 
                type="submit" 
                disabled={isSending || !newMessageText.trim()}
                className="w-10 h-10 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white flex items-center justify-center shadow-md transition-colors shrink-0"
              >
                <Send size={16} className={isSending ? "animate-pulse" : ""} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
