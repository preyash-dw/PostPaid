import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './components/Main.jsx';
import Admin from './components/Admin/Admin.jsx';
import Add from './components/Admin/Add.jsx';
import View from './components/Admin/View.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/admin" element={<Admin />}>
          <Route path="add" element={<Add />} />
          <Route path="view" element={<View/>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
