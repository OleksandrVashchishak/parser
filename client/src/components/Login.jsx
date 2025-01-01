import React, { useState } from 'react';
import { Button, Input, Form, message } from 'antd';
import { login } from '../api/auth';
import { saveToken } from '../utils/auth';

const Login = ({ onLogin }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const { token } = await login(values.username, values.password);
      saveToken(token);
      messageApi.success('Login successful');
      onLogin(); // Виклик функції для оновлення стану авторизації
    } catch (error) {
      messageApi.error('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onFinish={handleLogin} layout="vertical">
      {contextHolder}
      <Form.Item
        label="Username"
        name="username"
        rules={[{ required: true, message: 'Please input your username!' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: 'Please input your password!' }]}
      >
        <Input.Password />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={loading} block>
        Login
      </Button>
    </Form>
  );
};

export default Login;
