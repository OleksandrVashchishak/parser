import axios from 'axios';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;
export const login = async (username, password) => {
console.log('test');

  const response = await axios.post(`${REACT_APP_API_URL}/auth/login`, { username, password });
  console.log(response);
  
  return response.data; 
};
