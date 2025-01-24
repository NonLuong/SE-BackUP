import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { sendMessageToBackend, getMessagesByRoomChatId, Message } from '../../services/https/booking';
import './PassengerChat.css';

// 🛠️ ประเภทของข้อความในแชท
interface ChatMessage {
  sender: string;
  message: string;
  timestamp: string;
}



// 🛎️ PassengerChat Component
const PassengerChat: React.FC = () => {
  const location = useLocation();
  const { bookingId, driverId, passengerId, roomChatId, } = location.state || {};

  
  console.log('🛠️ Booking ID:', bookingId);
  console.log('🛠️ Driver ID:', driverId);
  console.log('🛠️ Passenger ID:', passengerId);
  console.log('🛠️ RoomChat ID:', roomChatId);



  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // ✅ ตั้งค่า WebSocket
  useEffect(() => {
    if (!bookingId || socketRef.current) return;

    const ws = new WebSocket(`ws://localhost:8080/ws/chat/passenger/${bookingId}`);

    ws.onopen = () => {
      console.log('✅ Connected to Chat Room:', bookingId);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.sender !== 'You') {
          setMessages((prev) => {
            const isDuplicate = prev.some(
              (msg) =>
                msg.timestamp === data.timestamp &&
                msg.message === data.message &&
                msg.sender === data.sender
            );

            if (isDuplicate) {
              console.warn('⚠️ Duplicate message detected');
              return prev;
            }

            return [
              ...prev,
              {
                sender: data.sender || 'Unknown',
                message: data.message,
                timestamp: data.timestamp || new Date().toLocaleTimeString(),
              },
            ];
          });
        }
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      console.warn('🔌 WebSocket disconnected. Reconnecting in 5 seconds...');
      setIsConnected(false);
      socketRef.current = null;
      setTimeout(() => {
        if (!socketRef.current) {
          socketRef.current = new WebSocket(`ws://localhost:8080/ws/chat/passenger/${bookingId}`);
        }
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    socketRef.current = ws;

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [bookingId]);

  // ✅ ดึงข้อความจาก Backend ตาม roomChatId
  useEffect(() => {
    const fetchMessages = async () => {
      if (!roomChatId) {
        console.warn('❌ Missing RoomChatId for fetching messages');
        return;
      }

      try {
        const fetchedMessages = await getMessagesByRoomChatId(String(roomChatId));
        console.log('✅ Fetched Messages:', fetchedMessages);
        setMessages(
          fetchedMessages.map((msg: any) => ({
            sender: msg.sender_type,
            message: msg.content,
            timestamp: msg.send_time,
          }))
        );
      } catch (error) {
        console.error('❌ Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [roomChatId]);


  // ✅ Scroll ไปยังข้อความล่าสุด
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages.length]);

  // ✅ ส่งข้อความ
  const handleSendMessage = async () => {
    if (!socketRef.current || !newMessage.trim()) {
      console.warn('❌ Cannot send empty message');
      return;
    }
  
    const timestamp = new Date().toLocaleTimeString();
  
    // ✉️ ส่งข้อความไปยัง WebSocket
    const messagePayload = {
      type: 'chat_message',
      bookingId,
      sender: 'Passenger',
      message: newMessage,
      timestamp,
      roomChatId, // ✅ เพิ่ม chatroomId ไปยัง WebSocket payload
    };
  
    console.log('📤 Sending message:', messagePayload);
  
    socketRef.current.send(JSON.stringify(messagePayload));
    setMessages((prev) => [
      ...prev,
      {
        sender: 'You',
        message: newMessage,
        timestamp,
      },
    ]);
  
    // 💾 ส่งข้อความไปยัง Backend
    const backendMessage: Message = {
      
      content: newMessage,
      message_type: 'text',
      read_status: false,
      send_time: new Date().toISOString(),
      passenger_id: Number(passengerId),
      booking_id: Number(bookingId),
      driver_id: Number(driverId),
      sender_id: Number(passengerId),
      sender_type: 'Passenger',
      room_id: Number(roomChatId), // ✅ เพิ่ม chatroomId สำหรับ Backend
    };
  
    console.log('📤 Sending message to backend:', backendMessage);
  
    const res = await sendMessageToBackend(backendMessage);
    if (!res) {
      console.error('❌ Failed to save message to backend');
    }
  
    setNewMessage('');
  };
  
  return (
    <div className="containerpassengerchat">
    <h1>💬 Chat with Driver</h1>
    <p><strong>Booking ID:</strong> {bookingId}</p>
    <p><strong>Driver ID:</strong> {driverId}</p>
    <p className={isConnected ? 'connected' : 'disconnected'}>
      {isConnected ? '🟢 Connected to Chat Room' : '🔴 Disconnected from Chat Room'}
    </p>
  
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



export default PassengerChat;