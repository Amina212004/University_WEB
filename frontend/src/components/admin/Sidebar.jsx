import { Home, LayoutGrid, GraduationCap, BookOpen, UserCircle, Settings, LogOut, CalendarDays, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  const isTeacher = user?.role === 'teacher';

  const navItems = isTeacher ? [
    // ── TEACHER NAV ──
    { id: 'overview',   icon: <Home size={20} />,          label: 'Tableau de bord' },
    { id: 'timetable',  icon: <CalendarDays size={20} />,  label: 'Mon Emploi du Temps' },
    { id: 'students',   icon: <GraduationCap size={20} />, label: 'Mes Étudiants' },
    { id: 'exams',      icon: <FileText size={20} />,      label: 'Mes Examens' },
    { id: 'materials',  icon: <BookOpen size={20} />,      label: 'Cours & Docs' },
    { id: 'profile',    icon: <UserCircle size={20} />,    label: 'Mon Profil' },
    { id: 'settings',   icon: <Settings size={20} />,      label: 'Paramètres' },
  ] : [
    // ── ADMIN NAV ──
    { id: 'overview',   icon: <Home size={20} />,          label: 'Tableau de bord' },
    { id: 'hierarchy',  icon: <LayoutGrid size={20} />,    label: 'Structure Académique' },
    { id: 'timetable',  icon: <CalendarDays size={20} />,  label: 'Emplois du Temps' },
    { id: 'teachers',   icon: <BookOpen size={20} />,      label: 'Enseignants' },
    { id: 'students',   icon: <GraduationCap size={20} />, label: 'Étudiants' },
    { id: 'materials',  icon: <BookOpen size={20} />,      label: 'Cours & Docs' },
    { id: 'profile',    icon: <UserCircle size={20} />,    label: 'Mon Profil' },
    { id: 'settings',   icon: <Settings size={20} />,      label: 'Paramètres' },
  ];

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="w-20 bg-brand-950 flex flex-col items-center py-6 gap-2 border-r border-brand-900">
      {/* Logo / Avatar */}
      <div className="mb-4">
        {user?.avatar_url
          ? <img src={user.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover border-2 border-brand-700" />
          : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white text-sm font-bold border-2 border-brand-700">
              {initials || '?'}
            </div>
        }
      </div>

      {/* Nav items */}
      <div className="flex flex-col items-center gap-2 flex-1">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'text-brand-400 hover:text-white hover:bg-brand-800'
              }`}
            >
              {item.icon}
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        title="Déconnexion"
        className="w-12 h-12 flex items-center justify-center rounded-2xl text-brand-500 hover:bg-rose-900/40 hover:text-rose-400 transition-colors"
      >
        <LogOut size={20} />
      </button>
    </div>
  );
}
