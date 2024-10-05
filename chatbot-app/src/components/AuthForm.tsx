import React, { useState } from 'react';
import { ApiService } from '../services/ApiService';

interface AuthFormProps {
  onAuthSuccess: (token: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (username.trim() === '' || password.trim() === '') {
      setError('Username and password cannot be empty');
      return;
    }

    try {
      let response;
      if (isLogin) {
        response = await ApiService.login(username, password);
      } else {
        response = await ApiService.register(username, password);
      }
      
      if (response) {
        onAuthSuccess(response.access_token);
      }
    } catch (error) {
      setError('Authentication failed. Please try again.');
    }
  };

  return (
    <div className="w-96 p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-4">{isLogin ? 'Login' : 'Register'}</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full mb-2 p-2 border border-gray-300 rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-4 p-2 border border-gray-300 rounded"
      />
      <button
        onClick={handleSubmit}
        className="w-full mb-2 p-2 bg-blue-500 text-white rounded"
      >
        {isLogin ? 'Login' : 'Register'}
      </button>
      <button
        onClick={() => setIsLogin(!isLogin)}
        className="w-full p-2 text-blue-500"
      >
        {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
      </button>
    </div>
  );
};

export default AuthForm;
