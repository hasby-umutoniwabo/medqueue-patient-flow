import React, { useState, useEffect } from 'react';
import DoctorLogin from './DoctorLogin';
import DoctorDashboard from './DoctorDashboard';
import Navigation from './Navigation';

const DoctorAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if doctor is already logged in
    const doctorData = localStorage.getItem('medqueue_doctor');
    if (doctorData) {
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('medqueue_doctor');
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return (
      <>
        <Navigation variant="minimal" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <Navigation variant="minimal" />
        <DoctorLogin onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <>
      <Navigation variant="minimal" />
      <DoctorDashboard onLogout={handleLogout} />
    </>
  );
};

export default DoctorAuth;
