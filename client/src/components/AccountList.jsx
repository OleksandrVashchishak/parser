import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message } from 'antd';
import { fetchAccounts, addAccount, deleteAccount } from '../api/accounts';
 
const AccountList = () => {
   const [messageApi, contextHolder] = message.useMessage();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAccountsList();
  }, []);
 
  const fetchAccountsList = async () => {
    setLoading(true);
    try {
      const data = await fetchAccounts();
      setAccounts(data);
    } catch (error) {
      messageApi.error('Error fetching accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (values) => {
    try {
      await addAccount(values);
      messageApi.success('Account added successfully');
      fetchAccountsList();
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      messageApi.error('Error adding account');
    }
  };

  const handleDeleteAccount = async (id) => {
    try {
      await deleteAccount(id);
      messageApi.success('Account deleted successfully');
      fetchAccountsList();
    } catch (error) {
      messageApi.error('Error deleting account');
    }
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          danger
          onClick={() => handleDeleteAccount(record.id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <Button type="primary" onClick={() => setIsModalVisible(true)} style={{ marginBottom: 20 }}>
        Add Account
      </Button>
      <Table
        columns={columns}
        dataSource={accounts}
        loading={loading}
        rowKey="user"
      />
      <Modal
        title="Add Account"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddAccount}>
          <Form.Item
            label="Username"
            name="user"
            rules={[{ required: true, message: 'Please input username' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input password' }]}
          >
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Add Account
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default AccountList;
