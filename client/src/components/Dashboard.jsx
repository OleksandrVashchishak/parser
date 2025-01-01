import React, { useEffect, useState } from "react";
import { Switch, message, Spin } from "antd";
import { fetchWorkerStatus, updateWorkerStatus } from "../api/worker";
import axios from 'axios';

const Dashboard = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [workerEnabled, setWorkerEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('loading'); // Статус сервера

  // Завантаження статусу воркера при завантаженні компонента
  useEffect(() => {
    const loadWorkerStatus = async () => {
      try {
        setLoading(true);
        const { enabled } = await fetchWorkerStatus();
        setWorkerEnabled(enabled);
      } catch (error) {
        messageApi.error("Failed to fetch worker status");
      } finally {
        setLoading(false);
      }
    };

    loadWorkerStatus();
  }, []);

  // Завантаження стану сервера
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const REACT_APP_API_URL = process.env.REACT_APP_API_URL;
        const response = await axios.get(REACT_APP_API_URL + '/health');
        setServerStatus(response.data.status); // Оновлення статусу сервера
      } catch (error) {
        setServerStatus('down'); // Якщо помилка - сервер не працює
        messageApi.error("Server is down");
      }
    };

    checkServerHealth();
  }, []);

  // Обробник для оновлення статусу воркера
  const handleWorkerToggle = async (checked) => {
    try {
      setLoading(true);
      await updateWorkerStatus(checked);
      setWorkerEnabled(checked);
      messageApi.success(`Worker ${checked ? "enabled" : "disabled"} successfully`);
    } catch (error) {
      messageApi.error("Failed to update worker status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {contextHolder}
      <h1>Worker Control</h1>

      {/* Стан сервера */}
      <div style={{ marginBottom: 20 }}>
        {serverStatus === 'loading' ? (
          <Spin />
        ) : (
          <span>Server is currently: {serverStatus === 'ok' ? 'Running' : 'Down'}</span>
        )}
      </div>

      {loading ? (
        <Spin />
      ) : (
        <div>
          <span>Worker is currently: {workerEnabled ? "Enabled" : "Disabled"}</span>
          <Switch
            checked={workerEnabled}
            onChange={handleWorkerToggle}
            style={{ marginLeft: 10 }}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
