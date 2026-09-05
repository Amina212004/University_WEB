import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Send, MessageSquare, X, Info } from 'lucide-react';
import { getChatHistory, sendMessage, getUsers } from '../../api/services';

export default function MessagesManager({ conversations = [] }) {
  const { user } = useAuth();
  
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    
    // Si l'utilisateur est admin, il ne parle qu'aux profs
    // Si l'utilisateur est prof, il ne parle qu'aux admins
    const targetRole = user.role === 'admin' ? 'teacher' : 'admin';
    
    getUsers(targetRole)
      .then(res => setAllUsers(res.data || []))
      .catch(console.error);
  }, [user]);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
    } finally {
      setIsSending(false);
    }
  };

  const targetRole = user?.role === 'admin' ? 'teacher' : 'admin';
  const validConversations = conversations.filter(c => c.role === targetRole);
  
  const convIds = new Set(validConversations.map(c => c.id));
  const otherUsers = allUsers.filter(u => !convIds.has(u.id) && u.id !== user?.id);
  const combinedUsers = [...validConversations, ...otherUsers];

  const filteredConvs = combinedUsers.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* ── HEADER ── */}
      <div className="bg-white px-8 py-5 flex items-center justify-between shadow-sm z-10 border-b border-slate-100 shrink-0">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed]">Communication</span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">Messagerie</h2>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex h-full overflow-hidden">
          
          {/* ── CONVERSATIONS SIDEBAR ── */}
          <div className="w-1/3 min-w-[280px] max-w-[350px] border-r border-slate-100 flex flex-col bg-white">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {filteredConvs.map(c => {
                const isActive = activeChatUser?.id === c.id;
                return (
                  <div 
                    key={c.id} 
                    onClick={() => {
                      setActiveChatUser(c);
                      setChatMessages([]);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      isActive ? 'bg-[#7c3aed] text-white shadow-md shadow-violet-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shadow-sm ${
                        isActive ? 'bg-white/20 text-white border border-white/30' : 'border border-slate-200 bg-white text-slate-700'
                      }`}
                      style={{ background: isActive ? '' : c.role === 'admin' ? 'linear-gradient(135deg,#f43f5e,#fb923c)' : c.role === 'teacher' ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'linear-gradient(135deg,#3b82f6,#2dd4bf)', color: isActive ? '' : 'white' }}
                      >
                        {c.first_name?.[0]?.toUpperCase()}{c.last_name?.[0]?.toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                          {c.first_name} {c.last_name}
                        </span>
                      </div>
                      {c.last_message && (
                        <p className={`text-[10px] truncate font-medium ${isActive ? 'text-violet-200' : 'text-slate-500'}`}>
                          {c.last_message_sender === user?.id ? 'Vous: ' : ''}{c.last_message}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredConvs.length === 0 && (
                <div className="text-center p-4 text-slate-400 text-xs font-bold mt-4">
                  Aucune conversation
                </div>
              )}
            </div>
          </div>

          {/* ── ACTIVE CHAT AREA ── */}
          <div className="flex-1 flex flex-col bg-slate-50/50">
            {activeChatUser ? (
              <>
                {/* Chat Header */}
                <div className="h-16 px-6 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs text-white shadow-sm"
                      style={{ background: activeChatUser.role === 'admin' ? 'linear-gradient(135deg,#f43f5e,#fb923c)' : activeChatUser.role === 'teacher' ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'linear-gradient(135deg,#3b82f6,#2dd4bf)' }}
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
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.map((msg) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-[20px] px-4 py-2.5 text-xs font-medium leading-relaxed shadow-sm ${
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
                      <MessageSquare size={48} className="text-slate-200 mb-4 animate-bounce" />
                      <p className="text-sm font-bold text-slate-500">Aucun message.</p>
                      <p className="text-xs font-medium text-slate-400 mt-1">Envoyez le premier message pour démarrer la discussion.</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input footer */}
                <form onSubmit={handleSendChat} className="p-4 border-t border-slate-100 bg-white flex gap-2 shrink-0">
                  <input 
                    type="text" 
                    value={newMessageText}
                    onChange={e => setNewMessageText(e.target.value)}
                    placeholder="Tapez votre message ici..."
                    className="flex-1 bg-slate-50 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={isSending || !newMessageText.trim()}
                    className="w-12 h-12 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white flex items-center justify-center shadow-md shadow-violet-200 shrink-0 transition-colors"
                  >
                    <Send size={18} className="ml-1" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare size={32} className="text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-500">Sélectionnez une conversation</p>
                <p className="text-xs font-medium text-slate-400 mt-1">Choisissez un contact dans la liste à gauche</p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
