import React, { useState } from 'react';
import { ApiService } from '../services/ApiService';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { AuthError } from '../types/api';

interface AuthFormProps {
  onAuthSuccess: (token: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (username.trim() === '' || password.trim() === '') {
      setError({ errors: [{ errorMessage: 'Username and password cannot be empty' }] });
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
      const e = error as Error;
      try {
        const authError = JSON.parse(e.message) as AuthError;
        setError(authError);
      } catch {
        setError({ errors: [{ errorMessage: e.message }] });
      }
    }
  };

  const handleToggleLogin = () => {
    setIsLogin(!isLogin);
    setUsername('');
    setPassword('');
    setError(null);
  };

  return (
    <div className="w-96 p-4 bg-white rounded-lg shadow-2xl">
      <div className="flex justify-center mb-4">
        <img
          src="/images/abi.jpg"
          alt="Abi"
          className="w-16 h-16 rounded-full"
        />
      </div>
      <h2 className="text-lg font-bold mb-4 text-center">Hey there, I'm Abi! {isLogin ? "Login to get started" : "Let's get you registered"}</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full mb-2 p-2 border border-gray-300 rounded-xl"
      />
      {error && error?.errors.map((error, index) => (
        error.name === 'username' ? <p key={index} className="text-red-500 mb-2">{error.errorMessage}</p> : null
      ))}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-2 p-2 border border-gray-300 rounded-xl pr-10"
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 flex items-center justify-center text-lg p-1"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <AiOutlineEyeInvisible className="align-middle" /> : <AiOutlineEye className="align-middle" />}
        </button>
      </div>
      {error && error?.errors.map((error, index) => (
        error.name === undefined || error.name === 'password' ? <p key={index} className="text-red-500 mb-2">{error.errorMessage}</p> : null
      ))}
      <button
        onClick={handleSubmit}
        className="w-full mb-6 p-2 bg-custom-purple text-white rounded-xl"
      >
        {isLogin ? 'Login' : 'Register'}
      </button>
      <p className="text-center">
        {isLogin ? (
          <>
            Don't have an account?{' '}
            <button
              onClick={handleToggleLogin}
              className="text-custom-purple underline"
            >
              Register
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={handleToggleLogin}
              className="text-custom-purple underline"
            >
              Login
            </button>
          </>
        )}
      </p>
    </div>
  );
};

export default AuthForm;
