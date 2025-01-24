import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { sendMessageToBackend, getMessagesByRoomChatId, Message } from '../../services/https/booking';
import './DriverChat.css';

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: string;
  message_id: number | undefined;
}

const DriverChat: React.FC = () => {
  const location = useLocation();
  const { bookingId, passengerId, driverID, roomChatId } = location.state || {};

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    const connectWebSocket = () => {
      const ws = new WebSocket(`ws://localhost:8080/ws/chat/driver/${bookingId}`);

      ws.onopen = () => {
        setIsConnected(true);
        console.log(`✅ Connected to Chat Room with Booking ID: ${bookingId}`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages((prev) => {
            if (prev.some((msg) => msg.message_id === data.message_id)) return prev;
            return [
              ...prev,
              {
                sender: data.sender || 'Unknown',
                message: data.message,
                timestamp: data.timestamp || new Date().toLocaleTimeString(),
                message_id: data.message_id,
              },
            ];
          });
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      socketRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [bookingId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!roomChatId) return;

      try {
        const fetchedMessages = await getMessagesByRoomChatId(String(roomChatId));
        setMessages(
          fetchedMessages.map((msg: any) => ({
            sender: msg.sender_type,
            message: msg.content,
            timestamp: msg.send_time,
            message_id: msg.message_id,
          }))
        );
      } catch (error) {
        console.error('❌ Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [roomChatId]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!socketRef.current || !newMessage.trim()) return;

    const timestamp = new Date().toLocaleTimeString();
    const temporaryMessageId = Date.now();

    const messagePayload = {
      type: 'chat_message',
      bookingId,
      sender: 'Driver',
      message: newMessage,
      timestamp,
    };

    socketRef.current.send(JSON.stringify(messagePayload));

    setMessages((prev) => [
      ...prev,
      {
        sender: 'You',
        message: newMessage,
        timestamp,
        message_id: temporaryMessageId,
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

    try {
      const res = await sendMessageToBackend(backendMessage);

      if (res && res.data) {
        const backendMessageId = res.data.ID;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.message_id === temporaryMessageId
              ? { ...msg, message_id: backendMessageId }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('❌ Error sending message to backend:', error);
    }

    setNewMessage('');
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
      className={`message ${msg.sender === 'You' ? 'message-user' : 'message-other'}`}
    >
      <p><strong>{msg.sender}:</strong> {msg.message}</p>
      <p className="timestamp">{msg.timestamp}</p>
    </div>
  ))}
</div>

      <div className="inputSection">
        <input
          className="input"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="พิมพ์ข้อความที่นี่..."
        />
        <button className="sendButton" onClick={handleSendMessage}>
          ➤
        </button>
      </div>
    </div>
  );
};

export default DriverChat;
