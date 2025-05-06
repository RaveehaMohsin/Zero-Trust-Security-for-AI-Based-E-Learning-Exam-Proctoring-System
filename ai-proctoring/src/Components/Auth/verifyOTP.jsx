import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyOTP = () => {
  const API_URL = 'http://localhost:5000/api/auth';

  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch email from localStorage when the component mounts
  useEffect(() => {
    const storedEmail = localStorage.getItem('emailForMFA');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/verify-otp`, { email, otp });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      
      if(response.data.role === "admin") {
        navigate('/admin');
      } else if(response.data.role === "student") {
        navigate('/student');
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      alert(error.response?.data?.message || 'Invalid OTP or it has expired');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h2 style={{
          marginBottom: '1.5rem',
          color: '#212529',
          fontWeight: '600'
        }}>
          Enter verification code
        </h2>
        
        <p style={{
          marginBottom: '2rem',
          color: '#495057',
          fontSize: '0.9rem'
        }}>
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
        
        <input
          type="text"
          value={otp}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, ''); // Only allow numbers
            setOtp(value.slice(0, 6)); // Limit to 6 digits
          }}
          placeholder="000000"
          style={{
            width: '100%',
            padding: '12px 16px',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            fontSize: '1.2rem',
            textAlign: 'center',
            letterSpacing: '8px',
            outline: 'none',
            transition: 'border 0.2s',
            ':focus': {
              borderColor: '#4dabf7',
              boxShadow: '0 0 0 3px rgba(77, 171, 247, 0.3)'
            }
          }}
          maxLength={6}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
        />
        
        <button 
          onClick={handleVerify}
          disabled={isLoading || otp.length !== 6}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isLoading ? '#adb5bd' : '#1971c2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            ':hover': {
              backgroundColor: isLoading ? '#adb5bd' : '#1864ab'
            },
            ':disabled': {
              backgroundColor: '#e9ecef',
              cursor: 'not-allowed'
            }
          }}
        >
          {isLoading ? 'Verifying...' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default VerifyOTP;