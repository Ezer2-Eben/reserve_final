// src/utils/errorHandler.js

// Types d'erreurs
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  VALIDATION: 'VALIDATION',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
};

// Codes d'erreur personnalisés
export const ERROR_CODES = {
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
};

class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
  }

  // Analyser le type d'erreur
  analyzeError(error) {
    if (!error) return { type: ERROR_TYPES.UNKNOWN, code: 'UNKNOWN_ERROR' };

    // Erreurs réseau
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      return { type: ERROR_TYPES.NETWORK, code: ERROR_CODES.NETWORK_OFFLINE };
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return { type: ERROR_TYPES.NETWORK, code: ERROR_CODES.NETWORK_TIMEOUT };
    }

    // Erreurs HTTP
    if (error.response) {
      const { status } = error.response;
      
      switch (status) {
        case 401:
          return { type: ERROR_TYPES.AUTHENTICATION, code: ERROR_CODES.UNAUTHORIZED };
        case 403:
          return { type: ERROR_TYPES.AUTHORIZATION, code: ERROR_CODES.FORBIDDEN };
        case 404:
          return { type: ERROR_TYPES.SERVER, code: ERROR_CODES.NOT_FOUND };
        case 422:
          return { type: ERROR_TYPES.VALIDATION, code: ERROR_CODES.VALIDATION_ERROR };
        case 429:
          return { type: ERROR_TYPES.SERVER, code: ERROR_CODES.RATE_LIMIT };
        case 500:
        case 502:
        case 503:
        case 504:
          return { type: ERROR_TYPES.SERVER, code: ERROR_CODES.SERVER_ERROR };
        default:
          return { type: ERROR_TYPES.SERVER, code: 'HTTP_ERROR' };
      }
    }

    return { type: ERROR_TYPES.UNKNOWN, code: 'UNKNOWN_ERROR' };
  }

  // Obtenir le message d'erreur utilisateur
  getUserMessage(error, context = '') {
    const analysis = this.analyzeError(error);
    
    const messages = {
      [ERROR_CODES.NETWORK_OFFLINE]: 'Connexion internet perdue. Vérifiez votre connexion.',
      [ERROR_CODES.NETWORK_TIMEOUT]: 'La requête a pris trop de temps. Veuillez réessayer.',
      [ERROR_CODES.UNAUTHORIZED]: 'Session expirée. Veuillez vous reconnecter.',
      [ERROR_CODES.FORBIDDEN]: 'Vous n\'avez pas les permissions nécessaires.',
      [ERROR_CODES.NOT_FOUND]: 'La ressource demandée n\'existe pas.',
      [ERROR_CODES.VALIDATION_ERROR]: 'Données invalides. Vérifiez vos saisies.',
      [ERROR_CODES.RATE_LIMIT]: 'Trop de requêtes. Veuillez patienter.',
      [ERROR_CODES.SERVER_ERROR]: 'Erreur serveur. Veuillez réessayer plus tard.',
    };

    const defaultMessage = context 
      ? `Erreur lors de ${context}. Veuillez réessayer.`
      : 'Une erreur inattendue s\'est produite.';

    return messages[analysis.code] || defaultMessage;
  }

  // Logger l'erreur
  logError(error, context = '') {
    const analysis = this.analyzeError(error);
    const timestamp = new Date().toISOString();
    
    const _errorEntry = {
      timestamp,
      context,
      type: analysis.type,
      code: analysis.code,
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      response: error?.response?.data,
      status: error?.response?.status,
    };

    // Ajouter au log
    this.errorLog.push(_errorEntry);
    
    // Limiter la taille du log
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log en console pour le développement
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Erreur [${analysis.code}] - ${context}`);
      console.error('Détails:', _errorEntry);
      console.groupEnd();
    }

    // En production, envoyer à un service de monitoring
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(_errorEntry);
    }
  }

  // Envoyer à un service de monitoring (exemple)
  sendToMonitoring(_errorEntry) {
    // Intégration avec Sentry, LogRocket, etc.
    // console.log('Sending to monitoring:', _errorEntry);
  }

  // Obtenir les erreurs récentes
  getRecentErrors(limit = 10) {
    return this.errorLog.slice(-limit);
  }

  // Nettoyer le log d'erreurs
  clearLog() {
    this.errorLog = [];
  }

  // Créer une erreur personnalisée
  createError(type, code, message, originalError = null) {
    const error = new Error(message);
    error.type = type;
    error.code = code;
    error.originalError = originalError;
    return error;
  }
}

// Instance singleton
const errorHandler = new ErrorHandler();
export default errorHandler;



