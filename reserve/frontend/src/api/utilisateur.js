import axios from 'axios';

const BASE_URL = 'http://localhost:9190/api/utilisateurs';

export const registerUser = async ({username, password}) => {
  const response = await axios.post(`${BASE_URL}/inscription`, {
    username,
    password,
  });
  return response.data;
};


export const getAllUsers = async (token) => {
  const response = await axios.get(BASE_URL, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};


export const deleteUserById = async (id, token) => {
  const response = await axios.delete(`${BASE_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
