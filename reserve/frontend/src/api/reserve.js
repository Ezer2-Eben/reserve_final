// src/api/reserve.js
import axios from 'axios';

const BASE_URL = 'http://localhost:9190/api/reserves';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  // Temporairement, on n'exige pas d'authentification pour tester
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Récupère la liste des réserves depuis l’API
 */
export const fetchReserves = async () => {
  console.log('Tentative de récupération des réserves depuis:', BASE_URL);
  console.log('Headers:', getAuthHeaders());
  
  try {
    const res = await axios.get(BASE_URL, {
      headers: getAuthHeaders()
    });
    console.log('Réponse reçue:', res);
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des réserves:', error);
    throw error;
  }
};

/**
 * Récupère une réserve par son ID
 */
export const getReserveById = async (id) => {
  const res = await axios.get(`${BASE_URL}/${id}`, {
    headers: getAuthHeaders()
  });
  return res.data;
};

/**
 * Crée une nouvelle réserve
 */
export const createReserve = async (data) => {
  const res = await axios.post(BASE_URL, data, {
    headers: getAuthHeaders()
  });
  return res.data;
};

/**
 * Met à jour une réserve existante
 */
export const updateReserve = async (id, data) => {
  const res = await axios.put(`${BASE_URL}/${id}`, data, {
    headers: getAuthHeaders()
  });
  return res.data;
};

/**
 * Supprime une réserve
 */
export const deleteReserve = async (id) => {
  const res = await axios.delete(`${BASE_URL}/${id}`, {
    headers: getAuthHeaders()
  });
  return res.data;
};
export { fetchReserves as getReserves };
