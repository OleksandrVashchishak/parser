const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

export const fetchLogs = async () => {
  const response = await fetch(REACT_APP_API_URL + '/logs', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  if (!response.ok) {
    throw new Error('Error fetching logs');
  }
  return response.json();
};
