import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:5000/api';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('athlete@test.com');
  const [password, setPassword] = useState('securepassword');
  const [name, setName] = useState('Test Athlete');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isRegister) {
        await axios.post(`${API_BASE}/auth/register`, {
          name,
          email,
          password,
          role: 'athlete'
        });
        setMessage('Account created! Authenticating...');
        const loginRes = await axios.post(`${API_BASE}/auth/login`, { email, password });
        localStorage.setItem('token', loginRes.data.access_token);
        localStorage.setItem('user', JSON.stringify(loginRes.data.user));
        navigate('/dashboard');
      } else {
        const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error || 'Authentication failed. Make sure Flask backend is running on port 5000.';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#030712', // Obsidian Black
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.08), transparent 70%), radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.06), transparent 70%)',
      color: '#f9fafb',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        padding: '40px 36px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            color: '#030712',
            fontWeight: '900',
            fontSize: '22px',
            marginBottom: '16px',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)'
          }}>
            360
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
            ATHLETE<span style={{ color: '#10b981' }}>360</span>
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            {isRegister ? 'Join the human-centric athletic intelligence portal' : 'Welcome back! Sign in to access your AI coach'}
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '14px',
            borderRadius: '12px',
            fontSize: '13px',
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            ⚠️ {error}
          </div>
        )}

        {message && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#6ee7b7',
            padding: '14px',
            borderRadius: '12px',
            fontSize: '13px',
            marginBottom: '20px'
          }}>
            ✨ {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor: '#090d16',
                  color: '#ffffff',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="athlete@test.com"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: '#090d16',
                color: '#ffffff',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: '#090d16',
                color: '#ffffff',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#030712',
              fontSize: '15px',
              fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.35)',
              opacity: loading ? 0.7 : 1,
              transition: 'transform 0.1s, box-shadow 0.2s'
            }}
          >
            {loading ? 'Authenticating...' : (isRegister ? 'Create Premium Account' : 'Sign In to Portal')}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#9ca3af' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setMessage('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#10b981',
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'none',
              padding: 0,
              marginLeft: '4px'
            }}
          >
            {isRegister ? 'Sign In' : 'Register Now'}
          </button>
        </div>
      </div>
    </div>
  );
}