// src/components/layouts/Sidebar.jsx
import { AlertCircle, Book, FileText, Home, LogOut, Map } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="h-screen w-64 bg-blue-900 text-white flex flex-col justify-between fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-8">Réserve Admin</h1>
        <nav className="space-y-4">
          <Link to="/dashboard" className="flex items-center gap-2 hover:bg-blue-700 p-2 rounded">
            <Home size={20} /> Réserves
          </Link>
          <Link to="/projets" className="flex items-center gap-2 hover:bg-blue-700 p-2 rounded">
            <FileText size={20} /> Projets
          </Link>
          <Link to="/documents" className="flex items-center gap-2 hover:bg-blue-700 p-2 rounded">
            <Book size={20} /> Documents
          </Link>
          <Link to="/alertes" className="flex items-center gap-2 hover:bg-blue-700 p-2 rounded">
            <AlertCircle size={20} /> Alertes
          </Link>
          <Link to="/map-demo" className="flex items-center gap-2 hover:bg-blue-700 p-2 rounded">
            <Map size={20} /> Carte Afrique
          </Link>
        </nav>
      </div>

      <div className="p-6">
        <button onClick={handleLogout} className="flex items-center gap-2 hover:bg-blue-700 p-2 rounded w-full">
          <LogOut size={20} /> Déconnexion
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
