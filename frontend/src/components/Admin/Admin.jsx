import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './Admin.css';

function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Check for token on component mount
  useEffect(() => {
    const tokenData = JSON.parse(localStorage.getItem('tokenData'));
    if (tokenData) {
      const currentTime = new Date().getTime();
      
      // Check if token has expired
      if (currentTime < tokenData.expiration) {
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem('tokenData'); // Remove expired token
      }
    }
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const expirationTime = new Date().getTime() + 60 * 60 * 1000; // 1 hour from now
        const tokenData = { token: data.token, expiration: expirationTime };
        localStorage.setItem('tokenData', JSON.stringify(tokenData));
        setIsLoggedIn(true);
        navigate('/admin');
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error logging in. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tokenData');
    setIsLoggedIn(false);
    navigate('/admin');
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
          <button onClick={handleLogout}>Logout</button>
          <div className="options">
            <NavLink to="/admin/view" className="option">View</NavLink>
            <NavLink to="/admin/add" className="option">Add New</NavLink>
            <NavLink to="/admin/collection" className="option">Collection</NavLink>
            <NavLink to="/admin/viewcollection" className="option">View Collection</NavLink>
            <NavLink to="/admin/addplan" className="option">Add Plan</NavLink>
            <NavLink to="/admin/viewplans" className="option">View Plans</NavLink>
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
