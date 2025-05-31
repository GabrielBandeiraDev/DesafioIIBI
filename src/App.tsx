import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';


function App() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/produtos" element={<HomePage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
           <Route path="/Dashboard" element={<Dashboard />} />
        </Routes>
    </Router>
  );
}

export default App;
