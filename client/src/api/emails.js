const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

export const fetchEmails = async () => {
  const response = await fetch(REACT_APP_API_URL + '/emails', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,  // Додавання токену для авторизації
    },
  });
  if (!response.ok) {
    throw new Error('Error fetching emails');
  }
  return response.json();  // Повертає дані у форматі JSON
};
