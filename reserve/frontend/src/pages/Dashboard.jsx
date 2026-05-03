// src/pages/Dashboard.jsx
import { Navigate, Route, Routes } from 'react-router-dom';

import DashboardLayout from '../components/layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';

import Alertes from './dashboard/alerte';
import Documents from './dashboard/documents';
import Historique from './dashboard/historique';
import Overview from './dashboard/overview';
import Projets from './dashboard/projets';
import Reserves from './dashboard/reserves';
import Utilisateurs from './dashboard/utilisateurs';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  
  console.log('Dashboard - User:', user);
  console.log('Dashboard - isAuthenticated:', isAuthenticated);
  console.log('Dashboard - User role:', user?.role);
  
  // 1. Si non connecté, rediriger vers login
  if (!isAuthenticated) {
    console.log('Dashboard: Non authentifié, redirection vers /login');
    return <Navigate to="/login" replace />;
  }
  
  // 2. Vérifier si l'utilisateur existe et a un rôle
  if (!user || !user.role) {
    console.log('Dashboard: Utilisateur ou rôle manquant');
    return <Navigate to="/login" replace />;
  }
  
  // 3. Si ce n'est pas un admin, rediriger vers la page visite
  if (user.role !== 'ADMIN') {
    console.log(`Dashboard: Rôle "${user.role}" n'est pas ADMIN, redirection vers /visite`);
    return <Navigate to="/visite" replace />;
  }
  
  // 4. Seulement les admins arrivent ici
  console.log('Dashboard: Accès admin autorisé');
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/reserves" element={<Reserves />} />
        <Route path="/alertes" element={<Alertes />} />
        <Route path="/projets" element={<Projets />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/historique" element={<Historique />} />
        <Route path="/utilisateurs" element={<Utilisateurs />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;