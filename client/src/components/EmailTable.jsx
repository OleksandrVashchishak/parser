import React, { useEffect, useState } from "react";
import { Table, message, Button, Spin } from "antd";
import { fetchEmails } from "../api/emails"; // Import the function to fetch emails

const EmailsTable = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // State for the "Refresh" button

  // Function to load emails
  const fetchEmailsData = async () => {
    setLoading(true);
    try {
      const data = await fetchEmails(); // Function to fetch emails from backend
      setEmails(data);
    } catch (error) {
      messageApi.error("Error loading emails");
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh emails via button click
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEmailsData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchEmailsData();

    const intervalId = setInterval(fetchEmailsData, 2 * 60 * 1000);

    return () => clearInterval(intervalId); // Clean up the interval on component unmount
  }, []);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Account",
      dataIndex: "account",
      key: "account",
    },
    {
      title: "Processed at",
      dataIndex: "processed_at",
      key: "timestprocessed_atamp",
      render: (text) => new Date(text).toLocaleString(),
    },
  ];

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: "20px" }}>
        <Button
          type="primary"
          onClick={handleRefresh}
          loading={refreshing} // Show the loader on the button when clicked
        >
          Get New Emails
        </Button>
      </div>

      <Spin spinning={loading} tip="Loading emails...">
        <Table
          dataSource={emails}
          columns={columns}
          loading={loading}
          rowKey={(record) => record.id}
          pagination={{ pageSize: 20 }}
          style={{ marginTop: "20px" }}
        />
      </Spin>
    </>
  );
};

export default EmailsTable;
