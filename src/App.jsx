import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/homePage/HomePage';
import HospitalDashboard from './components/hospitalDashboard/HospitalDashboard';
import DonorDashboard from './components/donorDashboard/DonorDashboard';
import AdminDashboard from './components/adminDashboard/AdminDashboard';
import RegistrationModal from './components/registrationForm/RegistrationModal';
import MroVerificationPopup from './components/mroVerificationPopup/MroVerificationPopup';
import MRODashboard from './components/mroDashboard/MRODashboard'; // Assuming you have a MRO Dashboard component
import LoginModal from './components/loginForm/LoginModal';

function App() {
  const [showMroPopup, setShowMroPopup] = useState(false);

  const handleRegistrationComplete = () => {
    setShowMroPopup(true);
  };

  return (
    <Router>
      <Routes>
        <Route path="/HospitalDashboard" element={<HospitalDashboard />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/DonorDashboard" element={<DonorDashboard />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        {/* <Route path="/RegistrationForm" element={<RegistrationForm />} /> */}
        <Route path='/RegistrationModal' element={<RegistrationModal onRegistrationComplete={handleRegistrationComplete} />} />
        <Route path="/MRODashboard" element={<MRODashboard />} />
        <Route path="/login" element={<LoginModal />} />
        <Route path="*" element={<Navigate to="/" />} />
        {/* Add other routes as needed */}
      </Routes>
      <MroVerificationPopup isOpen={showMroPopup} onClose={() => setShowMroPopup(false)} />
    </Router>
  );
}

export default App;
