import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/homePage/HomePage';
import HospitalDashboard from './components/hospitalDashboard/HospitalDashboard';
import DonorDashboard from './components/donorDashboard/DonorDashboard';
import AdminDashboard from './components/adminDashboard/AdminDashboard';
import RegistrationModal from './components/registrationForm/RegistrationModal';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/HospitalDashboard" element={<HospitalDashboard />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/DonorDashboard" element={<DonorDashboard />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        {/* <Route path="/RegistrationForm" element={<RegistrationForm />} /> */}
        <Route path='/RegistrationModal' element={<RegistrationModal />} />
      </Routes>
    </Router>
  );
}

export default App;
