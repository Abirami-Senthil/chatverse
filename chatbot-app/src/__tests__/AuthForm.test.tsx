import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AuthForm from '../components/AuthForm';

// Mock ApiService to simulate API calls for login and registration
jest.mock('../services/ApiService', () => ({
    login: jest.fn(),
    register: jest.fn(),
}));

const mockOnAuthSuccess = jest.fn();

describe('AuthForm Component', () => {
    beforeEach(() => {
        // Clear all mocks before each test to prevent test interference
        jest.clearAllMocks();
    });

    /**
     * Test to verify that the AuthForm renders correctly in login mode.
     * Ensures all UI elements, such as input fields and buttons, are displayed properly.
     */
    test('renders AuthForm with login mode', () => {
        render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
        expect(screen.getByText("Hey there, I'm Abi! Login to get started")).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByText('Login')).toBeInTheDocument();
    });

    /**
     * Test to check if the component properly toggles between login and register modes.
     * Ensures that clicking the toggle button changes the UI accordingly.
     */
    test('toggles between login and register mode', () => {
        render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
        fireEvent.click(screen.getByText('Register'));
        expect(screen.getByText(/let's get you registered/i)).toBeInTheDocument();
        expect(screen.getByText('Register')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Login'));
        expect(screen.getByText("Hey there, I'm Abi! Login to get started")).toBeInTheDocument();
    });

    /**
     * Test to verify that an error message is displayed when username or password is empty.
     * Prevents form submission if required fields are not filled in.
     */
    test('displays error message when username or password is empty', async () => {
        render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
        fireEvent.click(screen.getByText('Login'));
        expect(await screen.findByText('Username and password cannot be empty')).toBeInTheDocument();
    });

    /**
     * Test to verify that the password visibility toggle works correctly.
     * Ensures that the user can view or hide their password by clicking the toggle icon.
     */
    test('shows and hides password when toggle icon is clicked', () => {
        render(<AuthForm onAuthSuccess={mockOnAuthSuccess} />);
        const passwordInput = screen.getByPlaceholderText('Password');
        const toggleButton = screen.getAllByRole('button')[0];

        // Initially password should be hidden
        expect(passwordInput).toHaveAttribute('type', 'password');

        // Click to show password
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');

        // Click to hide password again
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
    });
});