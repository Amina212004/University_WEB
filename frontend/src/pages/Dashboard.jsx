import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/admin/Sidebar';

// Admin components
import Overview from '../components/admin/Overview';
import StudentsManager from '../components/admin/StudentsManager';
import TeachersManager from '../components/admin/TeachersManager';
import HierarchyManager from '../components/admin/HierarchyManager';
import TimetableManager from '../components/admin/TimetableManager';

// Teacher components
import TeacherOverview from '../components/admin/TeacherOverview';
import TeacherTimetable from '../components/admin/TeacherTimetable';
import TeacherStudents from '../components/admin/TeacherStudents';
import TeacherExams from '../components/admin/TeacherExams';
import MaterialsManager from '../components/admin/MaterialsManager';

// Shared components
import ProfileManager from '../components/admin/ProfileManager';
import SettingsManager from '../components/admin/SettingsManager';
import MessagesManager from '../components/admin/MessagesManager';
import { getConversations } from '../api/services';
import { MessageSquare, X } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const isTeacher = user?.role === 'teacher';

  // Global Chat States
  const [conversations, setConversations] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadTime, setLastReadTime] = useState(0); // timestamp of when user last opened messages
  const lastMsgTimeRef = useRef(0);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const loadConvs = () => {
      getConversations()
        .then(r => {
          const newConvs = r.data || [];
          setConversations(newConvs);

          // Check for new messages
          let latestTime = lastMsgTimeRef.current;
          let newMsgUser = null;
          let newMsgText = null;

          const targetRole = user?.role === 'admin' ? 'teacher' : 'admin';

          newConvs.forEach(c => {
            if (c.role !== targetRole) return;
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
            // On first load, count messages already unread (received while user was away)
            if (activeTab !== 'messages') {
              const targetRole2 = user?.role === 'admin' ? 'teacher' : 'admin';
              const count = newConvs.filter(c => {
                if (c.role !== targetRole2) return false;
                if (!c.last_message_date) return false;
                return c.last_message_sender !== user?.id;
              }).length;
              setUnreadCount(count);
            }
            return;
          }

          if (latestTime > lastMsgTimeRef.current) {
            lastMsgTimeRef.current = latestTime;
            if (activeTab !== 'messages') {
              setUnreadCount(prev => prev + 1);
              setToastMessage(`Nouveau message de ${newMsgUser.first_name} ${newMsgUser.last_name}: "${newMsgText}"`);
              setTimeout(() => setToastMessage(null), 5000);
            }
          }
        })
        .catch(console.error);
    };
    
    loadConvs();
    const convInterval = setInterval(loadConvs, 4000);
    return () => clearInterval(convInterval);
  }, [user, activeTab]);

  // Reset unread count when user opens messages tab
  useEffect(() => {
    if (activeTab === 'messages') {
      setUnreadCount(0);
      setToastMessage(null);
      setLastReadTime(Date.now()); // mark all as read right now
    }
  }, [activeTab]);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={unreadCount} />

      <div className="flex-1 flex overflow-hidden">
        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          isTeacher
            ? <TeacherOverview user={user} setActiveTab={setActiveTab} conversations={conversations} unreadCount={unreadCount} lastReadTime={lastReadTime} />
            : <Overview user={user} setActiveTab={setActiveTab} conversations={conversations} unreadCount={unreadCount} lastReadTime={lastReadTime} />
        )}

        {/* ── Timetable ── */}
        {activeTab === 'timetable' && (
          isTeacher ? <TeacherTimetable /> : <TimetableManager />
        )}

        {/* ── Students ── */}
        {activeTab === 'students' && (
          isTeacher ? <TeacherStudents /> : <StudentsManager />
        )}

        {/* ── Exams (teacher only) ── */}
        {activeTab === 'exams' && isTeacher && <TeacherExams />}

        {/* ── Admin only ── */}
        {activeTab === 'hierarchy' && !isTeacher && <HierarchyManager />}
        {activeTab === 'teachers'  && !isTeacher && <TeachersManager />}

        {/* ── Shared ── */}
        {activeTab === 'messages'  && <MessagesManager conversations={conversations} />}

        {/* ── Teacher only: Cours & Docs ── */}
        {activeTab === 'materials' && isTeacher && <MaterialsManager />}

        {activeTab === 'profile'   && <ProfileManager />}
        {activeTab === 'settings'  && <SettingsManager />}
      </div>

      {/* Global Toast Notification (Phone style) */}
      {toastMessage && (
        <div 
          onClick={() => {
            setActiveTab('messages');
            setToastMessage(null);
          }}
          className="fixed top-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-slate-200/50 shadow-2xl rounded-[32px] p-2 pr-6 flex items-center gap-3 animate-fade-in-down z-[999] min-w-[300px] max-w-sm cursor-pointer hover:bg-slate-50 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center shrink-0 shadow-inner">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0 py-1">
            <p className="font-black text-xs text-slate-800">Nouveau message</p>
            <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{toastMessage}</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setToastMessage(null);
            }} 
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
