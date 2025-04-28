import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const handleVerify = async () => {
    const email = localStorage.getItem('emailForMFA');
    const response = await axios.post(`${API_URL}/verify-otp`, { email, otp });
    localStorage.setItem('token', response.data.token);
    navigate('/admin');
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

// Make sure to export it as the default export
export default VerifyOTP;
