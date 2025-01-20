import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { sendMessageToBackend, getMessagesByRoomChatId, Message } from '../../services/https/booking';
import './DriverChat.css'; // Import the CSS file
import { updateMessageToBackend, deleteMessageFromBackend, UpdateMessage } from '../../services/https/message/message';

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: string;
  message_id: number; // Ensure message_id is always used
}

const DriverChat: React.FC = () => {
  const location = useLocation();
  const { bookingId, passengerId, driverID, roomChatId } = location.state || {};

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [editingMessage, setEditingMessage] = useState<number | null>(null);
  const [editedMessage, setEditedMessage] = useState<string>('');
  const [hoveredMessageIndex, setHoveredMessageIndex] = useState<number | null>(null); // State for showing buttons
  const socketRef = useRef<WebSocket | null>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // Set up WebSocket connection
  useEffect(() => {
    if (!bookingId || socketRef.current) return;

    const ws = new WebSocket(`ws://localhost:8080/ws/chat/driver/${bookingId}`);

    ws.onopen = () => {
      setIsConnected(true);
      console.log(`✅ Connected to Chat Room with Booking ID: ${bookingId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📥 Received message from WebSocket:', data);

        if (data.sender !== 'You') {
          setMessages((prev) => {
            const isDuplicate = prev.some(
              (msg) =>
                msg.timestamp === data.timestamp &&
                msg.message === data.message &&
                msg.sender === data.sender
            );

            if (isDuplicate) {
              console.log('⚠️ Duplicate message detected, not adding');
              return prev;
            }

            return [
              ...prev,
              {
                sender: data.sender || 'Unknown',
                message: data.message,
                timestamp: data.timestamp || new Date().toLocaleTimeString(),
                message_id: data.message_id, // Ensure message_id is included
              },
            ];
          });
        }
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      socketRef.current = null;
      console.warn('🔌 WebSocket disconnected. Reconnecting in 5 seconds...');
      setTimeout(() => {
        if (!socketRef.current) {
          socketRef.current = new WebSocket(`ws://localhost:8080/ws/chat/driver/${bookingId}`);
        }
      }, 5000);
    };

    socketRef.current = ws;

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [bookingId]);

  // Fetch messages from the backend when the component is mounted or roomChatId changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!roomChatId) return;

      try {
        const fetchedMessages = await getMessagesByRoomChatId(String(roomChatId));
        console.log('✅ Fetched messages from backend:', fetchedMessages);

        setMessages(
          fetchedMessages.map((msg: any) => ({
            sender: msg.sender_type,
            message: msg.content,
            timestamp: msg.send_time,
            message_id: msg.message_id, // Store message_id for reference
          }))
        );
      } catch (error) {
        console.error('❌ Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [roomChatId]);

  // Scroll to the bottom of the chat when new messages arrive
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!socketRef.current || !newMessage.trim()) {
      return;
    }

    const timestamp = new Date().toLocaleTimeString();
    const messagePayload = {
      type: 'chat_message',
      bookingId,
      sender: 'Driver',
      message: newMessage,
      timestamp,
    };

    console.log('📤 Sending message to WebSocket:', messagePayload);
    socketRef.current.send(JSON.stringify(messagePayload));
    setMessages((prev) => [
      ...prev,
      {
        sender: 'You',
        message: newMessage,
        timestamp,
        message_id: undefined, // Temporary message_id until backend responds
      },
    ]);

    const backendMessage: Message = {
      content: newMessage,
      message_type: 'text',
      read_status: false,
      send_time: new Date().toISOString(),
      passenger_id: Number(passengerId),
      booking_id: Number(bookingId),
      driver_id: Number(driverID),
      sender_id: Number(driverID),
      sender_type: 'Driver',
      room_id: Number(roomChatId),
    };

    console.log('📤 Sending message to backend:', backendMessage);
    const res = await sendMessageToBackend(backendMessage);
    console.log('Backend response:', res);

    if (res && res.data) {
      const backendMessageId = res.data.ID;  // Get the message ID from backend response
      console.log('Message ID from backend:', backendMessageId);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'You',
          message: newMessage,
          timestamp,
          message_id: backendMessageId,  // Use backend's message ID
        },
      ]);
    } else {
      console.error('❌ Failed to save message to backend');
    }

    setNewMessage('');
  };

  // Handle message edit
  const handleEditMessage = (index: number) => {
    setEditingMessage(index);
    console.log("obuggggggggg",(messages[index].message));
    setEditedMessage(messages[index].message);
    console.log("abuggggggg",(messages[index].message));
    console.log('✏️ Editing message:', messages[index]);
  };

  // Save edited message to backend
  const handleSaveEditedMessage = async () => {
    if (editingMessage === null || !editedMessage.trim()) return;

    const updatedMessages = [...messages];
    updatedMessages[editingMessage].message = editedMessage;
    console.log("editing",editingMessage)
    console.log("yyyyyyyy",editedMessage)
    setMessages(updatedMessages);

    const timestamp = new Date().toLocaleTimeString();
    const messagePayload = {
      type: 'edit_message',
      bookingId,
      sender: 'Driver',
      message: editedMessage,
      timestamp,
    };

    console.log('📤 Sending edited message to WebSocket:', messagePayload);
    socketRef.current?.send(JSON.stringify(messagePayload));

    const backendMessage: UpdateMessage = {
      content: editedMessage,
      message_id: messages[editingMessage]?.message_id, // Use message_id here
    };

    // Check if message_id exists before sending update request
    if (!backendMessage.message_id) {
      console.error('❌ message_id is missing');
      return;
    }

    console.log('📤 Updating message in backend:', backendMessage);
    const res = await updateMessageToBackend(backendMessage);
    console.log('Backend response after update:', res);

    if (!res) {
      console.error('❌ Failed to save edited message to backend');
    }

    setEditingMessage(null);
    setEditedMessage('');
  };

  // Handle message deletion
  const handleDeleteMessage = (index: number) => {
    const message_id = messages[index]?.message_id;
    if (!message_id) {
      console.error('❌ Message ID is missing for deletion');
      return;
    }

    const updatedMessages = messages.filter((_, msgIndex) => msgIndex !== index);
    setMessages(updatedMessages);

    const messagePayload = {
      type: 'delete_message',
      bookingId,
      message: messages[index].message,
    };

    console.log('📤 Deleting message from WebSocket:', messagePayload);
    socketRef.current?.send(JSON.stringify(messagePayload));
  };

  return (
    <div className="containerdriverchat">
      <h1>🗨️ Chat with Passenger</h1>
      <p><strong>Booking ID:</strong> {bookingId}</p>
      <p><strong>Passenger ID:</strong> {passengerId}</p>
      {isConnected ? (
        <p className="connected">🟢 Connected to Chat Room</p>
      ) : (
        <p className="disconnected">🔴 Disconnected from Chat Room</p>
      )}

      <div className="chatBox" ref={chatBoxRef}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className="message"
            style={{
              alignSelf: msg.sender === 'You' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.sender === 'You' ? '#d1e7dd' : '#f8d7da',
            }}
            onClick={() => setHoveredMessageIndex(index)} // Show buttons when clicked
          >
            <p><strong>{msg.sender}:</strong> {msg.message}</p>
            <p className="timestamp">{msg.timestamp}</p>

            {hoveredMessageIndex === index && msg.sender === 'You' && ( // Show buttons only if hovered message is yours
              <div className="messageActions">
                <button onClick={() => handleEditMessage(index)}>✏️ Edit</button>
                <button onClick={() => handleDeleteMessage(index)}>🗑️ Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="inputSection">
        {editingMessage !== null ? (
          <>
            <input
              className="input"
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
            />
            <button className="sendButton" onClick={handleSaveEditedMessage}>
              💾 Save
            </button>
          </>
        ) : (
          <>
            <input
              className="input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="พิมพ์ข้อความที่นี่..."
            />
            <button className="sendButton" onClick={handleSendMessage}>
              ➤
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DriverChat;
