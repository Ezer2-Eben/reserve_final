// src/routes/AppRoutes.jsx
import { Navigate, Route, Routes } from 'react-router-dom';

import ReserveCreationDemo from '../components/reserve/ReserveCreationDemo';
import MapExample from '../components/ui/MapExample';
import { useAuth } from '../context/AuthContext';
import Dashboard from '../pages/Dashboard';
import LoginPage from '../pages/LoginPage';
import MapDemo from '../pages/MapDemo';
import NotFound from '../pages/NotFound';
import RegisterPage from '../pages/RegisterPage';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/login" />}
      />
      <Route
        path="/map-test"
        element={user ? <MapExample /> : <Navigate to="/login" />}
      />
      <Route
        path="/map-demo"
        element={user ? <MapDemo /> : <Navigate to="/login" />}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
