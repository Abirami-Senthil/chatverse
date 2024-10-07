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
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles form submission for login or registration.
   * Performs validation, initiates API call, and manages the loading state.
   */
  const handleSubmit = async () => {
    // Ensure both username and password fields are filled.
    if (username.trim() === '' || password.trim() === '') {
      setError({ errors: [{ errorMessage: 'Username and password cannot be empty' }] });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call appropriate API based on the form mode (login or registration).
      const response = isLogin
        ? await ApiService.login(username, password)
        : await ApiService.register(username, password);

      // If successful, pass the token to the parent component.
      if (response) {
        onAuthSuccess(response.access_token);
      }
    } catch (error) {
      // Handle any errors that occurred during the API call.
      handleError(error);
    } finally {
      // Reset the loading state.
      setIsLoading(false);
    }
  };

  /**
   * Handles errors by parsing the error message and setting the error state.
   * @param error - The error object thrown during the API call.
   * Attempts to parse the error message, or provides a default error message if parsing fails.
   */
  const handleError = (error: unknown) => {
    if (error instanceof Error) {
      try {
        const authError = JSON.parse(error.message) as AuthError;
        setError(authError);
      } catch {
        setError({ errors: [{ errorMessage: 'An unexpected error occurred. Please try again.' }] });
      }
    } else {
      setError({ errors: [{ errorMessage: 'An unknown error occurred. Please contact support.' }] });
    }
  };

  /**
   * Toggles between login and registration mode.
   * Clears form inputs and any existing error messages.
   */
  const handleToggleLogin = () => {
    setIsLogin((prevIsLogin) => !prevIsLogin);
    setUsername('');
    setPassword('');
    setError(null);
  };

  /**
   * Handles the Enter key press event to submit the form.
   * @param e - The keyboard event.
   * Calls the handleSubmit function when the Enter key is pressed.
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  /**
   * Renders error messages below the input fields.
   * @param fieldName - The name of the field to filter errors for.
   */
  const renderErrorMessage = (fieldName: string | undefined) => {
    return error && error.errors
      .filter((err) => err.name === fieldName || (fieldName === undefined && !err.name))
      .map((err, index) => (
        <p key={index} className="text-red-500 mb-2">{err.errorMessage}</p>
      ));
  };

  return (
    <div className="w-96 p-4 bg-white rounded-lg shadow-2xl">
      {/* Avatar image */}
      <div className="flex justify-center mb-4">
        <img
          src="/images/abi.jpg"
          alt="Abi"
          className="w-16 h-16 rounded-full"
        />
      </div>

      {/* Header text indicating form mode */}
      <h2 className="text-lg font-bold mb-4 text-center">
        Hey there, I'm Abi! {isLogin ? "Login to get started" : "Let's get you registered"}
      </h2>

      {/* Username input field */}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full mb-2 p-2 border border-gray-300 rounded-xl"
        disabled={isLoading}
      />
      {/* Display error message if username is invalid */}
      {renderErrorMessage('username')}

      {/* Password input field with visibility toggle */}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full mb-2 p-2 border border-gray-300 rounded-xl pr-10"
          disabled={isLoading}
        />
        {/* Button to toggle password visibility */}
        <button
          type="button"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 flex items-center justify-center text-lg p-1"
          onClick={() => setShowPassword((prevShowPassword) => !prevShowPassword)}
          disabled={isLoading}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <AiOutlineEyeInvisible className="align-middle" /> : <AiOutlineEye className="align-middle" />}
        </button>
      </div>
      {/* Display error message if password is invalid */}
      {renderErrorMessage('password')}
      {/* Display any generic error messages */}
      {renderErrorMessage(undefined)}

      {/* Submit button for login or registration */}
      <button
        onClick={handleSubmit}
        className={`w-full mb-6 p-2 ${isLoading ? 'bg-gray-400' : 'bg-custom-purple'} text-white rounded-xl`}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
      </button>

      {/* Toggle link between login and registration mode */}
      <p className="text-center">
        {isLogin ? (
          <>
            Don't have an account?{' '}
            <button
              onClick={handleToggleLogin}
              className="text-custom-purple underline"
              disabled={isLoading}
              aria-label="Switch to registration form"
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
              disabled={isLoading}
              aria-label="Switch to login form"
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
