import React, { useEffect, useState } from 'react';
import { Table, message, Button, Spin } from 'antd';
import { fetchLogs } from '../api/logs'; // Import the function to fetch logs

const LogsTable = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // State for the "Refresh" button

  // Function to load logs
  const fetchLogsData = async () => {
    setLoading(true);
    try {
      const data = await fetchLogs();
      setLogs(data);
    } catch (error) {
      messageApi.error('Error loading logs');
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh logs via button click
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogsData();
    setRefreshing(false);
  };

  useEffect(() => {
    // Load logs on first render
    fetchLogsData();

    // Auto-refresh every 2 minutes
    const intervalId = setInterval(fetchLogsData, 2 * 60 * 1000);

    return () => clearInterval(intervalId); // Clean up the interval on component unmount
  }, []);

  const columns = [
    {
      title: 'Account',
      dataIndex: 'account',
      key: 'account',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => new Date(text).toLocaleString(),
    },
  ];

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: '20px' }}>
        <Button 
          type="primary" 
          onClick={handleRefresh} 
          loading={refreshing} // Show the loader on the button when clicked
        >
          Get New Logs
        </Button>
      </div>

      <Spin spinning={loading} tip="Loading logs...">
        <Table
          dataSource={logs}
          columns={columns}
          loading={loading}
          rowKey={(record) => record.id}
          pagination={{ pageSize: 20 }}
          style={{ marginTop: '20px' }}
        />
      </Spin>
    </>
  );
};

export default LogsTable;
