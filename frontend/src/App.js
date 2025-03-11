import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './components/Main.jsx';
import Admin from './components/Admin/Admin.jsx';
import Add from './components/Admin/Add.jsx';
import View from './components/Admin/View.jsx';
import Collection from './components/Admin/Collection.jsx';
import ViewCollection from './components/Admin/ViewCollection.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/admin" element={<Admin />}>
          <Route path="add" element={<Add />} />
          <Route path="view" element={<View/>} />
          <Route path="collection" element={<Collection/>}/>
          <Route path="viewcollection" element={<ViewCollection/>}/>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
