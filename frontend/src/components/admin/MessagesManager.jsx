import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, Send, MessageSquare, Shield, GraduationCap, 
  Clock, Check, CheckCheck, Sparkles, User, RefreshCw,
  CornerDownLeft, Circle, Lock
} from 'lucide-react';
import { getChatHistory, sendMessage, getUsers, getConversations } from '../../api/services';

export default function MessagesManager({ conversations = [] }) {
  const { user } = useAuth();
  
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [localConversations, setLocalConversations] = useState(conversations);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';
  const targetRole = isTeacher ? 'admin' : 'teacher';

  // Load potential users to start a chat with
  const loadUsersAndConversations = async () => {
    try {
      const [usersRes, convsRes] = await Promise.all([
        getUsers(targetRole).catch(() => ({ data: [] })),
        getConversations().catch(() => ({ data: [] }))
      ]);
      setAllUsers(usersRes.data || []);
      setLocalConversations(convsRes.data || []);
    } catch (err) {
      console.error("Error loading chat contacts:", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadUsersAndConversations();
    const interval = setInterval(loadUsersAndConversations, 6000);
    return () => clearInterval(interval);
  }, [user, targetRole]);

  // Message polling when an active chat is open
  useEffect(() => {
    if (!activeChatUser) return;
    
    const loadMessages = () => {
      getChatHistory(activeChatUser.id)
        .then(res => setChatMessages(res.data || []))
        .catch(console.error);
    };

    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChatUser]);

  // Scroll to bottom smoothly on message update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = async (e) => {
    if (e) e.preventDefault();
    if (!newMessageText.trim() || !activeChatUser || isSending) return;

    const messageContent = newMessageText.trim();
    setIsSending(true);

    try {
      const res = await sendMessage({
        receiver_id: activeChatUser.id,
        content: messageContent
      });
      
      setChatMessages(prev => [...prev, res.data]);
      setNewMessageText('');
      
      // Update the local last message in conversations list
      setLocalConversations(prev => {
        const index = prev.findIndex(c => c.id === activeChatUser.id);
        const updatedUser = {
          ...activeChatUser,
          last_message: messageContent,
          last_message_date: new Date().toISOString(),
          last_message_sender: user.id
        };

        if (index >= 0) {
          const updated = [...prev];
          updated[index] = updatedUser;
          return updated.sort((a, b) => new Date(b.last_message_date || 0) - new Date(a.last_message_date || 0));
        } else {
          return [updatedUser, ...prev];
        }
      });

      if (inputRef.current) inputRef.current.focus();
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  // Combine conversation participants and contacts without messages yet
  const validConversations = (localConversations.length > 0 ? localConversations : conversations)
    .filter(c => c.role === targetRole);
  
  const convIds = new Set(validConversations.map(c => c.id));
  const otherContacts = allUsers.filter(u => !convIds.has(u.id) && u.id !== user?.id);
  const combinedContacts = [...validConversations, ...otherContacts];

  const filteredContacts = combinedContacts.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Automatically select first contact if none selected
  useEffect(() => {
    if (!activeChatUser && filteredContacts.length > 0) {
      setActiveChatUser(filteredContacts[0]);
    }
  }, [filteredContacts.length]);

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatLastMessageDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f5f3ff] relative overflow-hidden font-sans">
      
      {/* ── TOP BAR HEADER ── */}
      <div className="bg-white/80 backdrop-blur-md px-6 md:px-8 py-4 flex items-center justify-between shadow-xs border-b border-brand-100 shrink-0 z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 font-extrabold text-[10px] uppercase tracking-wider mb-1">
            <Sparkles size={11} className="text-brand-600" />
            Communication Institutionnelle
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Espace Messagerie
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-bold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {isTeacher ? "Canal Direct avec l'Administration" : "Canal Enseignants"}
          </div>

          <button
            onClick={async () => {
              setIsRefreshing(true);
              await loadUsersAndConversations();
              if (activeChatUser) {
                const res = await getChatHistory(activeChatUser.id).catch(() => ({ data: [] }));
                setChatMessages(res.data || []);
              }
              setIsRefreshing(false);
            }}
            title="Actualiser la boîte de réception"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-300 transition-all shadow-xs"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin text-brand-600" : ""} />
          </button>
        </div>
      </div>

      {/* ── CHAT MAIN CONTAINER ── */}
      <div className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="bg-white rounded-3xl shadow-xl shadow-brand-950/5 border border-brand-100 flex h-full overflow-hidden">
          
          {/* ══════════ LEFT SIDEBAR: CONTACTS LIST ══════════ */}
          <div className="w-full sm:w-80 md:w-96 border-r border-slate-100 flex flex-col bg-white shrink-0">
            
            {/* Search Header */}
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={isTeacher ? "Rechercher l'administration..." : "Rechercher un enseignant..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-between mt-3 text-[11px] font-extrabold text-slate-400 px-1 uppercase tracking-wider">
                <span>Contacts ({filteredContacts.length})</span>
                <span className="text-brand-600">{isTeacher ? "Administration" : "Professeurs"}</span>
              </div>
            </div>

            {/* Contacts Scroll List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredContacts.map((contact) => {
                const isActive = activeChatUser?.id === contact.id;
                const contactInitials = `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`.toUpperCase() || 'U';
                const hasMessages = Boolean(contact.last_message);
                const isSentByMe = contact.last_message_sender === user?.id;

                return (
                  <div 
                    key={contact.id} 
                    onClick={() => {
                      setActiveChatUser(contact);
                      setChatMessages([]);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-brand-50 to-purple-50/60 border border-brand-200 shadow-xs' 
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {contact.avatar_url ? (
                        <img 
                          src={contact.avatar_url} 
                          alt="Avatar" 
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-xs ${
                          contact.role === 'admin' 
                            ? 'bg-gradient-to-tr from-brand-600 to-accent-500' 
                            : 'bg-gradient-to-tr from-brand-600 to-indigo-600'
                        }`}>
                          {contactInitials}
                        </div>
                      )}
                      
                      {/* Status indicator */}
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
                    </div>

                    {/* Contact Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`font-black text-xs truncate ${isActive ? 'text-brand-900' : 'text-slate-800'}`}>
                          {contact.first_name} {contact.last_name}
                        </span>
                        {contact.last_message_date && (
                          <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-1">
                            {formatLastMessageDate(contact.last_message_date)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-[11px] truncate font-medium ${
                          isActive ? 'text-brand-700 font-semibold' : 'text-slate-500'
                        }`}>
                          {hasMessages ? (
                            <>
                              {isSentByMe && <span className="text-brand-600 font-bold">Vous : </span>}
                              {contact.last_message}
                            </>
                          ) : (
                            <span className="text-slate-400 italic">Démarrer une discussion</span>
                          )}
                        </p>

                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider shrink-0 ${
                          contact.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {contact.role === 'admin' ? 'Admin' : 'Prof'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredContacts.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  <User size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Aucun contact trouvé</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Vérifiez l'orthographe de votre recherche.</p>
                </div>
              )}
            </div>
          </div>

          {/* ══════════ RIGHT AREA: ACTIVE CHAT CONVERSATION ══════════ */}
          <div className="flex-1 flex flex-col bg-[#fdfcff] overflow-hidden">
            {activeChatUser ? (
              <>
                {/* ── Chat Header ── */}
                <div className="px-6 py-3.5 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    {/* Header Avatar */}
                    <div className="relative">
                      {activeChatUser.avatar_url ? (
                        <img 
                          src={activeChatUser.avatar_url} 
                          alt="Avatar" 
                          className="w-10 h-10 rounded-2xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-xs ${
                          activeChatUser.role === 'admin' 
                            ? 'bg-gradient-to-tr from-brand-600 to-accent-500' 
                            : 'bg-gradient-to-tr from-brand-600 to-indigo-600'
                        }`}>
                          {`${activeChatUser.first_name?.[0] || ''}${activeChatUser.last_name?.[0] || ''}`.toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-slate-800">
                          {activeChatUser.first_name} {activeChatUser.last_name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 ${
                          activeChatUser.role === 'admin' 
                            ? 'bg-brand-100 text-brand-700' 
                            : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {activeChatUser.role === 'admin' ? <Shield size={10} /> : <GraduationCap size={10} />}
                          {activeChatUser.role === 'admin' ? 'Administration' : 'Enseignant'}
                        </span>
                      </div>

                      <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Circle size={7} className="fill-emerald-500 text-emerald-500" />
                        En ligne • {activeChatUser.email || "Messagerie interne"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Messages Feed ── */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                  
                  {/* Start of conversation banner */}
                  <div className="text-center my-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                      <Lock size={10} />
                      Discussion chiffrée & réservée au cadre universitaire
                    </div>
                  </div>

                  {chatMessages.map((msg, index) => {
                    const isMe = msg.sender_id === user?.id;
                    const time = formatMessageTime(msg.created_at);

                    return (
                      <div 
                        key={msg.id || index} 
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in-up`}
                      >
                        <div className={`max-w-[80%] md:max-w-[65%] px-4 py-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs transition-all ${
                          isMe 
                            ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-tr-xs shadow-md shadow-brand-600/15' 
                            : 'bg-white text-slate-800 border border-slate-100 rounded-tl-xs shadow-sm'
                        }`}>
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          
                          <div className={`flex items-center justify-end gap-1 text-[9px] font-bold mt-1.5 ${
                            isMe ? 'text-violet-200' : 'text-slate-400'
                          }`}>
                            <span>{time}</span>
                            {isMe && <CheckCheck size={12} className="text-violet-200" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {chatMessages.length === 0 && (
                    <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-slate-400 space-y-3">
                      <div className="w-16 h-16 rounded-3xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-500 shadow-sm">
                        <MessageSquare size={28} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-slate-700">Aucun message pour le moment</p>
                        <p className="text-xs font-medium text-slate-400 mt-1">
                          Envoyez un premier message à {activeChatUser.first_name} pour démarrer la discussion.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* ── Message Input Footer ── */}
                <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                  <form onSubmit={handleSendChat} className="flex items-center gap-2">
                    <div className="flex-1 relative flex items-center">
                      <input 
                        ref={inputRef}
                        type="text" 
                        value={newMessageText}
                        onChange={e => setNewMessageText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Écrire un message à ${activeChatUser.first_name}... (Entrée pour envoyer)`}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-10 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-inner"
                      />
                      <span className="absolute right-3.5 text-slate-300 pointer-events-none hidden sm:inline-block">
                        <CornerDownLeft size={14} />
                      </span>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSending || !newMessageText.trim()}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-accent-500 hover:from-brand-700 hover:to-accent-600 disabled:opacity-50 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-brand-600/20 hover:shadow-brand-600/35 hover:scale-[1.02] transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isSending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Envoyer</span>
                          <Send size={14} />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              /* Empty state when no conversation is active */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="w-20 h-20 bg-brand-50 rounded-3xl border border-brand-100 flex items-center justify-center mb-4 text-brand-600 shadow-sm">
                  <MessageSquare size={36} />
                </div>
                <h3 className="text-base font-black text-slate-800">Sélectionnez une discussion</h3>
                <p className="text-xs font-medium text-slate-400 mt-1 max-w-sm">
                  Choisissez un interlocuteur dans la liste de gauche pour échanger des informations ou poser des questions.
                </p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
