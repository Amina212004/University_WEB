import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsers } from '../api/services';
import Sidebar from '../components/admin/Sidebar';
import Overview from '../components/admin/Overview';
import ContactsSidebar from '../components/admin/ContactsSidebar';
import StudentsManager from '../components/admin/StudentsManager';
import TeachersManager from '../components/admin/TeachersManager';
import logo from '../assets/Logo.svg';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (user) {
      getUsers().then(res => setUsers(res.data)).catch(console.error);
    }
  }, [user]);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* 1. Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {activeTab === 'overview' && <Overview user={user} />}
        {activeTab === 'students' && <StudentsManager />}
        {activeTab === 'teachers' && <TeachersManager />}
        {activeTab === 'settings' && (
           <div className="flex-1 p-8 text-slate-500">Paramètres (En construction)</div>
        )}
        {activeTab === 'help' && (
           <div className="flex-1 p-8 text-slate-500">Aide (En construction)</div>
        )}

      </div>

      {/* 3. Right Sidebar (Contacts & Alerts) */}
      <ContactsSidebar users={users} />

    </div>
  );
}
