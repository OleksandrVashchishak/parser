const REACT_APP_API_URL = process.env.REACT_APP_API_URL;
// Отримання статусу воркера
export const fetchWorkerStatus = async () => {
    const response = await fetch(`${REACT_APP_API_URL}/worker/status`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
    });
    if (!response.ok) {
        throw new Error("Error fetching worker status");
    }
    return response.json();
};

// Оновлення статусу воркера
export const updateWorkerStatus = async (enabled) => {
    const response = await fetch(`${REACT_APP_API_URL}/worker/status`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ enabled: enabled }),
    });
    if (!response.ok) {
        throw new Error("Error updating worker status");
    }
    return response.json();
};
