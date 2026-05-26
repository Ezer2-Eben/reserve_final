// src/api/auth.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:9190/api';
const API_URL = `${API_BASE}/auth`;
const REGISTER_URL = `${API_BASE}/utilisateurs`;

export const loginUser = async (credentials) => {
  const response = await axios.post(`${API_URL}/login`, credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await axios.post(`${REGISTER_URL}/inscription`, userData);
  return response.data;
};
