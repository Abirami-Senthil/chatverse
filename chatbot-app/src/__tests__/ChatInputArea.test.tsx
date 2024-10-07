import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { ChatInputArea } from '../components/ChatInputArea';

// Mock props for the ChatInputArea component
const mockProps = {
  input: '',
  setInput: jest.fn(),
  isEditing: { index: null, text: '', interactionId: '' },
  setIsEditing: jest.fn(),
  handleEditSave: jest.fn(),
  sendMessage: jest.fn(),
  showCreateChat: false,
  setShowCreateChat: jest.fn(),
  chats: [
    { chat_id: '1', chat_name: 'General Chat' },
    { chat_id: '2', chat_name: 'Support Chat' },
  ],
  selectedChat: '',
  handleChatSelect: jest.fn(),
  newChatName: '',
  setNewChatName: jest.fn(),
  handleCreateChat: jest.fn(),
  cancelCreateChat: jest.fn(),
};

describe('ChatInputArea Component', () => {
  // Test to ensure the input area for user messages is rendered
  test('renders input area for user messages', () => {
    render(<ChatInputArea {...mockProps} />);
    expect(screen.getByPlaceholderText('Select or create a new chat')).toBeInTheDocument();
  });

  // Test to ensure the chat dropdown is rendered when not creating a new chat
  test('renders chat dropdown when not creating a new chat', () => {
    render(<ChatInputArea {...mockProps} />);
    expect(screen.getByText('Context')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  // Test to ensure the create chat input field is rendered when showCreateChat is true
  test('renders create chat input field when showCreateChat is true', () => {
    render(<ChatInputArea {...mockProps} showCreateChat={true} />);
    expect(screen.getByPlaceholderText('Enter chat name')).toBeInTheDocument();
  });

  // Test to ensure setShowCreateChat is called when the create new chat button is clicked
  test('calls setShowCreateChat when create new chat button is clicked', () => {
    render(<ChatInputArea {...mockProps} />);
    fireEvent.click(screen.getByLabelText('Create new chat'));
    expect(mockProps.setShowCreateChat).toHaveBeenCalledWith(true);
  });

  // Test to ensure sendMessage is called when the send button is clicked
  test('calls sendMessage when send button is clicked', () => {
    render(<ChatInputArea {...mockProps} />);
    fireEvent.click(screen.getByLabelText('Send message'));
    expect(mockProps.sendMessage).toHaveBeenCalled();
  });

  // Test to ensure handleEditSave is called when editing and save button is clicked
  test('calls handleEditSave when editing and save button is clicked', () => {
    render(<ChatInputArea {...mockProps} isEditing={{ index: 0, text: 'Edited message', interactionId: '1' }} />);
    fireEvent.click(screen.getByLabelText('Save edited message'));
    expect(mockProps.handleEditSave).toHaveBeenCalled();
  });

  // Test to ensure cancelCreateChat is called when the cancel button is clicked during new chat creation
  test('calls cancelCreateChat when cancel button is clicked during new chat creation', () => {
    render(<ChatInputArea {...mockProps} showCreateChat={true} />);
    fireEvent.click(screen.getByLabelText('Cancel create chat'));
    expect(mockProps.cancelCreateChat).toHaveBeenCalled();
  });

  // Test to ensure handleCreateChat is called when the create chat button is clicked
  test('calls handleCreateChat when create chat button is clicked', () => {
    render(<ChatInputArea {...mockProps} showCreateChat={true} newChatName='New Chat' />);
    fireEvent.click(screen.getByLabelText('Create chat'));
    expect(mockProps.handleCreateChat).toHaveBeenCalled();
  });

  // Test to ensure the create chat button is disabled when the new chat name is empty
  test('disables create chat button when new chat name is empty', () => {
    render(<ChatInputArea {...mockProps} showCreateChat={true} newChatName='' />);
    expect(screen.getByLabelText('Create chat')).toBeDisabled();
  });
});
