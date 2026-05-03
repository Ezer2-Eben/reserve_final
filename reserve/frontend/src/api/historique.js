import axios from 'axios';

const BASE_URL = 'http://localhost:9190/api/historiques';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getAllHistoriques = async () => {
  try {
    const res = await axios.get(BASE_URL, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des historiques:', error);
    throw error;
  }
};

export const getHistoriqueById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    throw error;
  }
};

export const createHistorique = async (data) => {
  try {
    const res = await axios.post(BASE_URL, data, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la création de l\'historique:', error);
    throw error;
  }
};

export const updateHistorique = async (id, data) => {
  try {
    const res = await axios.put(`${BASE_URL}/${id}`, data, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'historique:', error);
    throw error;
  }
};

export const deleteHistorique = async (id) => {
  try {
    const res = await axios.delete(`${BASE_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'historique:', error);
    throw error;
  }
};
