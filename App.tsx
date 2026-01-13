
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from './components/Layout';
import Home from './pages/Home';
import AIAssistant from './pages/AIAssistant';
import PetCare from './pages/PetCare';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Community from './pages/Community';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Chat from './pages/Chat';
import FindFriends from './pages/FindFriends';
import PetProfilePage from './pages/PetProfile';
import { AppRoutes } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

export const BREED_DATA: Record<string, string[]> = {
  Dog: ['Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'Poodle', 'Mixed Breed'],
  Cat: ['Persian', 'Maine Coon', 'Siamese', 'Mixed Breed'],
  Rabbit: ['Holland Lop', 'Mini Rex', 'Dutch Rabbit'],
};

export const PET_CATEGORIES = [
  { id: 'mammal', name: 'Mammals', species: ['Dog', 'Cat', 'Rabbit', 'Hamster'] },
  { id: 'bird', name: 'Birds', species: ['Parrot', 'Canary'] },
];

const AppContent: React.FC = () => {
  useEffect(() => {
    // Force some fun styles on load
    document.title = "🐾 SS PAW PAL - BEST APP EVER! 🐾";
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path={AppRoutes.HOME} element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path={AppRoutes.AI_ASSISTANT} element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
      <Route path={AppRoutes.PET_CARE} element={<ProtectedRoute><PetCare /></ProtectedRoute>} />
      <Route path={AppRoutes.SETTINGS} element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path={AppRoutes.PET_PROFILE} element={<ProtectedRoute><PetProfilePage /></ProtectedRoute>} />
      <Route path={AppRoutes.CREATE_POST} element={<ProtectedRoute><Community /></ProtectedRoute>} />
      <Route path={AppRoutes.CHAT} element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path={AppRoutes.FIND_FRIENDS} element={<ProtectedRoute><FindFriends /></ProtectedRoute>} />
      <Route path={AppRoutes.TERMS} element={<ProtectedRoute><Terms /></ProtectedRoute>} />
      <Route path={AppRoutes.PRIVACY} element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <Router>
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  </Router>
);

export default App;