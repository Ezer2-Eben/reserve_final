import axios from 'axios';

const BASE_URL = 'http://localhost:9190/api/projets';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getAllProjets = async () => {
  try {
    const res = await axios.get(BASE_URL, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    throw error;
  }
};

export const getProjetById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la récupération du projet:', error);
    throw error;
  }
};

export const createProjet = async (data) => {
  try {
    const res = await axios.post(BASE_URL, data, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error);
    throw error;
  }
};

export const updateProjet = async (id, data) => {
  try {
    const res = await axios.put(`${BASE_URL}/${id}`, data, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du projet:', error);
    throw error;
  }
};

export const deleteProjet = async (id) => {
  try {
    const res = await axios.delete(`${BASE_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error);
    throw error;
  }
};
