// src/api/alerte.js
import axios from 'axios';

const BASE_URL = 'http://localhost:9190/api/alertes';

// Récupère automatiquement le header Authorization
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

export const getAllAlertes = async () => {
  try {
    const res = await axios.get(BASE_URL, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    throw error;
  }
};

export const getAlerteById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'alerte:', error);
    throw error;
  }
};

export const createAlerte = async (data) => {
  try {
    const res = await axios.post(BASE_URL, data, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la création de l\'alerte:', error);
    throw error;
  }
};

export const updateAlerte = async (id, data) => {
  try {
    const res = await axios.put(`${BASE_URL}/${id}`, data, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'alerte:', error);
    throw error;
  }
};

export const deleteAlerte = async (id) => {
  try {
    const res = await axios.delete(`${BASE_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'alerte:', error);
    throw error;
  }
};
