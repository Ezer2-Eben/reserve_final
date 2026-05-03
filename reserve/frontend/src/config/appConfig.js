// src/config/appConfig.js

// Configuration de l'application
export const APP_CONFIG = {
  // API Configuration
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:9190/api',
  
  // Google Maps Configuration
  GOOGLE_MAPS_API_KEY: 'AIzaSyDvZ_ZfFPksr_hrnOq6xvNyrIcuXkjCkFc',
  
  // Map Configuration
  MAP_CENTER: {
    lat: 6.1319,
    lng: 1.2228,
  },
  MAP_ZOOM: 7,
  
  // App Configuration
  APP_NAME: 'Système de Gestion des Réserves',
  VERSION: '2.0.0',
  
  // Feature Flags
  FEATURES: {
    DARK_MODE: true,
    NOTIFICATIONS: true,
    MAP_DRAWING: true,
    REAL_TIME_UPDATES: false,
  },
  
  // Timeout Configuration
  TIMEOUTS: {
    API_REQUEST: 10000,
    NOTIFICATION_DISPLAY: 5000,
    MAP_LOADING: 15000,
  },
};

export default APP_CONFIG; 