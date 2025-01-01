const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

export const fetchAccounts = async () => {
    const response = await fetch(REACT_APP_API_URL +'/accounts', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Error fetching accounts');
    }
    return response.json();
  };
  
  export const addAccount = async (accountData) => {
    const response = await fetch(REACT_APP_API_URL + '/accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(accountData),
    });
    if (!response.ok) {
      throw new Error('Error adding account');
    }
    return response.json();
  };
  
  export const deleteAccount = async (id) => {
    const response = await fetch(REACT_APP_API_URL+ `/accounts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) {
      throw new Error('Error deleting account');
    }
    return response.json();
  };
  