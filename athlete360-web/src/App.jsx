import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Notice the .jsx added at the end of these two lines:
import Login from './Login.jsx'; 
import Dashboard from './Dashboard.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}