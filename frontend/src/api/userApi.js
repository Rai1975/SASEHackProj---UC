import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const createUser = async (username) => {
  try {
    const response = await axios.post(`${API_URL}/user`, { username });
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUser = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
};

export const updateUser = async (userId, username) => {
  try {
    const response = await axios.post(`${API_URL}/user/update_user`, { user_id: userId, username });
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await axios.post(`${API_URL}/user/delete_user`, { user_id: userId });
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};