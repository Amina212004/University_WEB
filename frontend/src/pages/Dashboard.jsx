import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/admin/Sidebar';
import Overview from '../components/admin/Overview';
import StudentsManager from '../components/admin/StudentsManager';
import TeachersManager from '../components/admin/TeachersManager';
import HierarchyManager from '../components/admin/HierarchyManager';
import ProfileManager from '../components/admin/ProfileManager';
import TimetableManager from '../components/admin/TimetableManager';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'overview'   && <Overview user={user} />}
        {activeTab === 'hierarchy'  && <HierarchyManager />}
        {activeTab === 'students'   && <StudentsManager />}
        {activeTab === 'teachers'   && <TeachersManager />}
        {activeTab === 'timetable'  && <TimetableManager />}
        {activeTab === 'profile'    && <ProfileManager />}
        {activeTab === 'settings'   && (
          <div className="flex-1 p-8 text-slate-500">Parametres (En construction)</div>
        )}
      </div>
    </div>
  );
}
