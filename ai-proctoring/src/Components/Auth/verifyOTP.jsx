import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyOTP = () => {

  const API_URL = 'http://localhost:5000/api/auth';

  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  // Fetch email from localStorage when the component mounts
  useEffect(() => {
    const storedEmail = localStorage.getItem('emailForMFA');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleVerify = async () => {
    try {
      const response = await axios.post(`${API_URL}/verify-otp`, { email, otp });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role); // Now this will work
      navigate('/admin');
    } catch (error) {
      console.error('OTP verification failed:', error);
      alert('Invalid OTP or it has expired');
    }
  };

  return (
    <div>
      <h2>Enter OTP Sent to {email}</h2>
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="6-digit OTP"
      />
      <button onClick={handleVerify}>Verify</button>
    </div>
  );
};

export default VerifyOTP;
