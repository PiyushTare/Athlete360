import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './pages/LandingPage';
import { CoachLayout } from './components/CoachLayout';
import { CoachDashboard } from './pages/coach/CoachDashboard';
import { AthleteManagement } from './pages/coach/AthleteManagement';
import { TaskAssignmentSystem } from './pages/coach/TaskAssignmentSystem';
import { PerformanceAnalytics } from './pages/coach/PerformanceAnalytics';
import { TournamentManagement } from './pages/coach/TournamentManagement';
import { CoachMessages } from './pages/coach/CoachMessages';
import { CoachReports } from './pages/coach/CoachReports';
import { SettingsView } from './pages/shared/SettingsView';

import { AthleteLayout } from './components/AthleteLayout';
import { AthleteDashboard } from './pages/athlete/AthleteDashboard';
import { AthleteProfileView } from './pages/athlete/AthleteProfileView';
import { AssignedTasksView } from './pages/athlete/AssignedTasksView';
import { FitnessEligibilityView } from './pages/athlete/FitnessEligibilityView';
import { PerformanceInsightsView } from './pages/athlete/PerformanceInsightsView';
import { AthleteTournamentsView } from './pages/athlete/AthleteTournamentsView';
import { TrainingConsistencyView } from './pages/athlete/TrainingConsistencyView';
import { RecoveryTrackerView } from './pages/athlete/RecoveryTrackerView';
import { AchievementsView } from './pages/athlete/AchievementsView';
import { NotificationsView } from './pages/athlete/NotificationsView';
import { ConnectSmartwatchView } from './pages/athlete/ConnectSmartwatchView';
import { ManualDataEntryView } from './pages/athlete/ManualDataEntryView';
import { MatchStatsView } from './pages/athlete/MatchStatsView';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultRole, setAuthDefaultRole] = useState<'coach' | 'athlete'>('coach');

  // Navigation state within portals
  const [coachTab, setCoachTab] = useState('dashboard');
  const [athleteTab, setAthleteTab] = useState('dashboard');

  // New task / athlete shortcuts
  const [openNewTaskModal, setOpenNewTaskModal] = useState(false);

  const handleOpenAuth = (role: 'coach' | 'athlete') => {
    setAuthDefaultRole(role);
    setAuthModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08090d] flex items-center justify-center text-emerald-400">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-bold text-sm tracking-wide">Initializing Athlete 360 Platform...</span>
        </div>
      </div>
    );
  }

  // If Not Authenticated -> Show Landing Page & Auth Modal
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#08090d] flex flex-col justify-between">
        <Navbar onOpenAuth={handleOpenAuth} />
        <LandingPage onOpenAuth={handleOpenAuth} />
        <Footer />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultRole={authDefaultRole}
        />
      </div>
    );
  }

  // COACH PORTAL
  if (user.role === 'coach') {
    return (
      <CoachLayout
        currentTab={coachTab}
        onSelectTab={setCoachTab}
        onOpenNewTaskModal={() => {
          setCoachTab('tasks');
          setOpenNewTaskModal(true);
        }}
        onOpenNewAthleteModal={() => setCoachTab('athletes')}
      >
        {coachTab === 'dashboard' && (
          <CoachDashboard
            onNavigate={setCoachTab}
            onOpenNewTaskModal={() => {
              setCoachTab('tasks');
              setOpenNewTaskModal(true);
            }}
          />
        )}
        {coachTab === 'athletes' && <AthleteManagement />}
        {coachTab === 'tasks' && <TaskAssignmentSystem />}
        {coachTab === 'analytics' && <PerformanceAnalytics />}
        {coachTab === 'tournaments' && <TournamentManagement />}
        {coachTab === 'messages' && <CoachMessages />}
        {coachTab === 'reports' && <CoachReports />}
        {coachTab === 'settings' && <SettingsView />}
      </CoachLayout>
    );
  }

  // ATHLETE PORTAL (Strict 8-Menu Configuration)
  return (
    <AthleteLayout currentTab={athleteTab} onSelectTab={setAthleteTab}>
      {athleteTab === 'dashboard' && <AthleteDashboard onNavigate={setAthleteTab} />}
      {(athleteTab === 'vitals' || athleteTab === 'smartwatch') && <ConnectSmartwatchView />}
      {(athleteTab === 'training' || athleteTab === 'tasks') && <AssignedTasksView />}
      {(athleteTab === 'performance' || athleteTab === 'performance-insights') && <PerformanceInsightsView />}
      {(athleteTab === 'match-stats' || athleteTab === 'tournaments') && (
        <MatchStatsView onNavigateToManualEntry={() => setAthleteTab('manual-entry')} />
      )}
      {athleteTab === 'recovery' && <RecoveryTrackerView />}
      {(athleteTab === 'manual-entry' || athleteTab === 'fitness-eligibility') && <ManualDataEntryView />}
      {athleteTab === 'profile' && <AthleteProfileView />}
      {athleteTab === 'settings' && <SettingsView />}
    </AthleteLayout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
