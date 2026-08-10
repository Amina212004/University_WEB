import { useState } from 'react';
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

// Shared components
import ProfileManager from '../components/admin/ProfileManager';
import SettingsManager from '../components/admin/SettingsManager';
import MaterialsManager from '../components/admin/MaterialsManager';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const isTeacher = user?.role === 'teacher';

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex overflow-hidden">
        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          isTeacher
            ? <TeacherOverview user={user} setActiveTab={setActiveTab} />
            : <Overview user={user} setActiveTab={setActiveTab} />
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
        {activeTab === 'materials' && <MaterialsManager />}
        {activeTab === 'profile'   && <ProfileManager />}
        {activeTab === 'settings'  && <SettingsManager />}
      </div>
    </div>
  );
}
