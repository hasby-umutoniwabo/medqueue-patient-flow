import React, { useState, useEffect } from 'react';
import DoctorLogin from './DoctorLogin';
import DoctorDashboard from './DoctorDashboard';
import Navigation from './Navigation';

// Authentication wrapper component that handles doctor login/logout flow
// Shows login screen if not authenticated, dashboard if authenticated
const DoctorAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if doctor is already logged in from a previous session
    // This allows them to stay logged in across browser refreshes
    const doctorData = localStorage.getItem('medqueue_doctor');
    if (doctorData) {
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    // Called when the login component successfully authenticates a doctor
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    // Clear the session and return to login screen
    localStorage.removeItem('medqueue_doctor');
    setIsLoggedIn(false);
  };

  if (isLoading) {
    // Show loading spinner while we check their login status
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
    // Show login screen if they haven't authenticated yet
    return (
      <>
        <Navigation variant="minimal" />
        <DoctorLogin onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  // Show the main dashboard if they're logged in
  return (
    <>
      <Navigation variant="minimal" />
      <DoctorDashboard onLogout={handleLogout} />
    </>
  );
};

export default DoctorAuth;
