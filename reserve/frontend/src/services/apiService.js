// src/services/apiService.js
import axios from 'axios';

import errorHandler from '../utils/errorHandler';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://reserve-final.onrender.com/api';

// Fonction pour obtenir les headers d'authentification
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Configuration axios avec intercepteurs
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Logger l'erreur avec le contexte
    errorHandler.logError(error, 'API Request');
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Rejeter avec une erreur enrichie
    const enrichedError = errorHandler.createError(
      errorHandler.analyzeError(error).type,
      errorHandler.analyzeError(error).code,
      errorHandler.getUserMessage(error),
      error
    );
    
    return Promise.reject(enrichedError);
  }
);

// Service d'authentification
export const authService = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post('/utilisateurs/inscription', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  forgotPassword: async (email, newPassword) => {
    const response = await apiClient.post('/auth/forgot-password', { email, newPassword });
    return response.data;
  },
};

// Service des réserves
export const reserveService = {
  getAll: async () => {
    try {
      console.log('Appel API /reserves...');
      const response = await apiClient.get('/reserves');
      console.log('Réponse API réserves:', response);
      return response.data;
    } catch (error) {
      console.error('Erreur dans reserveService.getAll:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      console.log('Appel API /reserves/' + id);
      const response = await apiClient.get(`/reserves/${id}`);
      console.log('Réponse API réserve:', response);
      return response.data;
    } catch (error) {
      console.error('Erreur dans reserveService.getById:', error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      console.log('=== DEBUG reserveService.create ===');
      console.log('Données reçues:', data);
      console.log('URL complète:', `${apiClient.defaults.baseURL}/reserves`);
      
      const response = await apiClient.post('/reserves', data);
      console.log('Réponse création réserve:', response);
      console.log('=== FIN DEBUG ===');
      return response.data;
    } catch (error) {
      console.error('=== ERREUR reserveService.create ===');
      console.error('Erreur complète:', error);
      console.error('Status de la réponse:', error.response?.status);
      console.error('Message d\'erreur:', error.response?.data);
      console.error('URL de la requête:', error.config?.url);
      console.error('Méthode HTTP:', error.config?.method);
      console.error('Headers:', error.config?.headers);
      console.error('Données envoyées:', error.config?.data);
      console.error('=== FIN ERREUR ===');
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      console.log('Mise à jour réserve:', id, data);
      const response = await apiClient.put(`/reserves/${id}`, data);
      console.log('Réponse mise à jour réserve:', response);
      return response.data;
    } catch (error) {
      console.error('Erreur dans reserveService.update:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      console.log('Suppression réserve:', id);
      const response = await apiClient.delete(`/reserves/${id}`);
      console.log('Réponse suppression réserve:', response);
      return response.data;
    } catch (error) {
      console.error('Erreur dans reserveService.delete:', error);
      throw error;
    }
  },
};

// Service des alertes
export const alerteService = {
  getAll: async () => {
    try {
      console.log('Appel API /alertes...');
      const response = await apiClient.get('/alertes');
      console.log('Réponse API alertes:', response);
      return response.data;
    } catch (error) {
      console.error('Erreur dans alerteService.getAll:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      console.log('Appel API /alertes/' + id);
      const response = await apiClient.get(`/alertes/${id}`);
      console.log('Réponse API alerte:', response);
      return response.data;
    } catch (error) {
      console.error('Erreur dans alerteService.getById:', error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      console.log('Création alerte avec données:', data);
      const response = await apiClient.post('/alertes', data);
      console.log('Réponse création alerte:', response);
      return response.data;
    } catch (error) {
      console.error('Erreur dans alerteService.create:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      console.log('=== DEBUG alerteService.update ===');
      console.log('ID reçu:', id);
      console.log('Type de l\'ID:', typeof id);
      console.log('Données reçues:', data);
      console.log('URL complète:', `${apiClient.defaults.baseURL}/alertes/${id}`);
      
      if (!id || id === '') {
        throw new Error('ID de l\'alerte manquant ou invalide');
      }
      
      const response = await apiClient.put(`/alertes/${id}`, data);
      console.log('Réponse mise à jour alerte:', response);
      console.log('=== FIN DEBUG ===');
      return response.data;
    } catch (error) {
      console.error('=== ERREUR alerteService.update ===');
      console.error('Erreur complète:', error);
      console.error('Status de la réponse:', error.response?.status);
      console.error('Message d\'erreur:', error.response?.data);
      console.error('URL de la requête:', error.config?.url);
      console.error('Méthode HTTP:', error.config?.method);
      console.error('Headers:', error.config?.headers);
      console.error('=== FIN ERREUR ===');
      throw error;
    }
  },

  delete: async (id) => {
    try {
      console.log('Suppression alerte:', id);
      const response = await apiClient.delete(`/alertes/${id}`);
      console.log('Réponse suppression alerte:', response);
      return response.data;
    } catch (error) {
      console.error('Erreur dans alerteService.delete:', error);
      throw error;
    }
  },
};

// Service des projets
export const projetService = {
  getAll: async () => {
    const response = await apiClient.get('/projets');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/projets/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/projets', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/projets/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/projets/${id}`);
    return response.data;
  },
};

// Service des documents
export const documentService = {
  getAll: async () => {
    const response = await apiClient.get('/documents');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/documents', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/documents/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/documents/${id}`);
    return response.data;
  },

  // Nouvelles méthodes pour l'upload de fichiers
  uploadFile: async (formData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      throw error;
    }
  },

  createExternalDocument: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/documents/external`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du document externe:', error);
      throw error;
    }
  },

  downloadFile: async (id) => {
    const response = await apiClient.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getUploadInfo: async () => {
    const response = await apiClient.get('/documents/upload-info');
    return response.data;
  },

  fileExists: async (id) => {
    const response = await apiClient.get(`/documents/${id}/exists`);
    return response.data;
  },
};

// Service de l'historique juridique
export const historiqueService = {
  getAll: async () => {
    const response = await apiClient.get('/historiques');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/historiques/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/historiques', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/historiques/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/historiques/${id}`);
    return response.data;
  },
};

// Service des utilisateurs (admin seulement)
export const utilisateurService = {
  getAll: async () => {
    try {
      console.log('Appel API /utilisateurs...');
      const response = await apiClient.get('/utilisateurs');
      console.log('Réponse API utilisateurs:', response);
      return response.data;
    } catch (error) {
      console.error('Erreur dans utilisateurService.getAll:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/utilisateurs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur dans utilisateurService.getById:', error);
      throw error;
    }
  },
  
  create: async (userData) => {
    try {
      const response = await apiClient.post('/utilisateurs', userData);
      return response.data;
    } catch (error) {
      console.error('Erreur dans utilisateurService.create:', error);
      throw error;
    }
  },
  
  update: async (id, userData) => {
    try {
      const response = await apiClient.put(`/utilisateurs/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error('Erreur dans utilisateurService.update:', error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/utilisateurs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur dans utilisateurService.delete:', error);
      throw error;
    }
  },

  resetPassword: async (id, newPassword) => {
    try {
      const response = await apiClient.post(`/utilisateurs/${id}/reset-password`, { newPassword });
      return response.data;
    } catch (error) {
      console.error('Erreur dans utilisateurService.resetPassword:', error);
      throw error;
    }
  },

  toggleActif: async (id) => {
    try {
      const response = await apiClient.patch(`/utilisateurs/${id}/toggle-actif`);
      return response.data;
    } catch (error) {
      console.error('Erreur dans utilisateurService.toggleActif:', error);
      throw error;
    }
  },
};

// Service du journal d'activité
export const journalService = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/journal');
      return response.data;
    } catch (error) {
      console.error('Erreur dans journalService.getAll:', error);
      throw error;
    }
  },

  getRecent: async () => {
    try {
      const response = await apiClient.get('/journal/recent');
      return response.data;
    } catch (error) {
      console.error('Erreur dans journalService.getRecent:', error);
      throw error;
    }
  },

  getByModule: async (module) => {
    try {
      const response = await apiClient.get(`/journal/module/${module}`);
      return response.data;
    } catch (error) {
      console.error('Erreur dans journalService.getByModule:', error);
      throw error;
    }
  },
};

// Service des litiges
export const litigeService = {
  getAll: async () => {
    const response = await apiClient.get('/litiges');
    return response.data;
  },
  getByReserve: async (reserveId) => {
    const response = await apiClient.get(`/litiges/reserve/${reserveId}`);
    return response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/litiges', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/litiges/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/litiges/${id}`);
    return response.data;
  }
};

// Service des occupations
export const occupationService = {
  getAll: async () => {
    const response = await apiClient.get('/occupations');
    return response.data;
  },
  getByReserve: async (reserveId) => {
    const response = await apiClient.get(`/occupations/reserve/${reserveId}`);
    return response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/occupations', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/occupations/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/occupations/${id}`);
    return response.data;
  }
};

// Service des rapports et exports
export const rapportService = {
  getStats: async () => {
    const response = await apiClient.get('/rapports/statistiques');
    return response.data;
  },
  exportExcelUrl: () => `${API_BASE_URL}/rapports/export/excel`,
  exportPdfUrl: () => `${API_BASE_URL}/rapports/export/pdf`,
};

export default apiClient;
