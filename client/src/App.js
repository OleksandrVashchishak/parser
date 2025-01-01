// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu, Button } from 'antd';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EmailTable from './components/EmailTable';
import AccountList from './components/AccountList';
import LogsTable from './components/LogsTable';
import { getToken, clearToken } from './utils/auth';

const { Header, Content, Sider } = Layout;

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());

  const handleLogout = () => {
    clearToken();
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        {isAuthenticated && (
          <Sider>
            <Menu theme="dark" mode="inline" defaultSelectedKeys={['/']}>
              <Menu.Item key="/">
                <Link to="/">Home</Link>
              </Menu.Item>
              <Menu.Item key="/emails">
                <Link to="/emails">Emails</Link>
              </Menu.Item>
              <Menu.Item key="/logs">
                <Link to="/logs">Logs</Link>
              </Menu.Item>
              <Menu.Item key="/accounts">
                <Link to="/accounts">Accounts</Link>
              </Menu.Item>
            </Menu>
          </Sider>
        )}

        <Layout>
          {isAuthenticated && (
            <Header style={{ background: '#fff', padding: 0, textAlign: 'right' }}>
              <Button
                onClick={handleLogout}
                style={{
                  margin: '16px',
                  backgroundColor: '#ff4d4f',
                  color: '#fff',
                  border: 'none',
                }}
              >
                Logout
              </Button>
            </Header>
          )}

          <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              {isAuthenticated ? (
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/emails" element={<EmailTable />} />
                  <Route path="/logs" element={<LogsTable />} />
                  <Route path="/accounts" element={<AccountList />} />
                </Routes>
              ) : (
                <Login onLogin={() => setIsAuthenticated(true)} />
              )}
            </div>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App;
