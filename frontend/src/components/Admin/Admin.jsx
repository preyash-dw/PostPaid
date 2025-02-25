import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './Admin.css';

function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (username === 'admin' && password === 'password') {
      setIsLoggedIn(true);
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="admin-container">
      {!isLoggedIn ? (
        <div className="login-container">
          <h2>Login</h2>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <div className="dashboard">
          <h1>Welcome Admin</h1>
          <div className="options">
          <NavLink to="/admin/view" className="option">View</NavLink>
            
            <NavLink to="/admin/add" className="option">Add New</NavLink>

          </div>
          <div className="content-area">
            <Outlet />
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
