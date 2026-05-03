import axios from 'axios';

const BASE_URL = 'http://localhost:9190/api/documents';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getAllDocuments = async () => {
  try {
    const res = await axios.get(BASE_URL, {
      headers: getAuthHeaders()
    });
  return res.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des documents:', error);
    throw error;
  }
};

export const getDocumentById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/${id}`, {
      headers: getAuthHeaders()
    });
  return res.data;
  } catch (error) {
    console.error('Erreur lors de la récupération du document:', error);
    throw error;
  }
};

export const createDocument = async (data) => {
  try {
  const res = await axios.post(BASE_URL, data, {
      headers: getAuthHeaders()
  });
  return res.data;
  } catch (error) {
    console.error('Erreur lors de la création du document:', error);
    throw error;
  }
};

export const updateDocument = async (id, data) => {
  try {
  const res = await axios.put(`${BASE_URL}/${id}`, data, {
      headers: getAuthHeaders()
  });
  return res.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du document:', error);
    throw error;
  }
};

export const deleteDocument = async (id) => {
  try {
  const res = await axios.delete(`${BASE_URL}/${id}`, {
      headers: getAuthHeaders()
  });
  return res.data;
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error);
    throw error;
  }
};

export const createExternalDocument = async (data) => {
  try {
    const res = await axios.post(`${BASE_URL}/external`, data, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la création du document externe:', error);
    throw error;
  }
};

export const migrateToExternal = async (id, url) => {
  try {
    const res = await axios.put(`${BASE_URL}/${id}/migrate-to-external`, { url }, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la migration vers externe:', error);
    throw error;
  }
};

export const getUploadInfo = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/upload-info`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des infos upload:', error);
    throw error;
  }
};

export const checkFileExists = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/${id}/exists`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la vérification du fichier:', error);
    throw error;
  }
};

export const importFromFolder = async (folderPath, reserveId, recursive = false) => {
  try {
    const formData = new FormData();
    formData.append('folderPath', folderPath);
    formData.append('reserveId', reserveId);
    formData.append('recursive', recursive);

    const res = await axios.post(`${BASE_URL}/import-from-folder`, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de l\'import depuis le dossier:', error);
    throw error;
  }
};

export const getAvailableFolders = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/available-folders`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des dossiers:', error);
    throw error;
  }
};
