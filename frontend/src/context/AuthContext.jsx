import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [doctor,  setDoctor]  = useState(null);
  const [loading, setLoading] = useState(true);

  // Load doctor from token on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getProfile()
        .then(res => setDoctor(res.data.doctor))
        .catch(()  => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (token, doctorData) => {
    localStorage.setItem('token', token);
    setDoctor(doctorData);
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    setDoctor(null);
  };

  return (
    <AuthContext.Provider value={{ doctor, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
