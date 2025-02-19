import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './components/Main.jsx';
import Admin from './components/Admin/Admin.jsx';
import Update from './components/Admin/Update.jsx';
import Add from './components/Admin/Add.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/admin" element={<Admin />}>
          <Route path="update" element={<Update />} />
          <Route path="add" element={<Add />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
