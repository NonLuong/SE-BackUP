import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { sendMessageToBackend, getMessagesByRoomChatId, Message } from '../../services/https/booking';
import './PassengerChat.css'; // Import the CSS file
import { updateMessageToBackend, deleteMessageFromBackend } from '../../services/https/message/message';

// Interface สำหรับการอัปเดตข้อความ
interface UpdateMessage {
  content: string;  // ฟิลด์เดียวที่ต้องการอัปเดต
  message_id: number;  // ใช้ message_id สำหรับอัปเดต
}

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: string;
  message_id: number;
}

const PassengerChat: React.FC = () => {
  const location = useLocation();
  const { bookingId, driverId, passengerId, roomChatId } = location.state || {};

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [editingMessage, setEditingMessage] = useState<{ index: number | null, message: string | null }>({ index: null, message: null });
  const socketRef = useRef<WebSocket | null>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // ฟังก์ชันเพื่อเปิดโหมดการแก้ไขข้อความ
  const handleEditMessage = (index: number) => {
    setEditingMessage({ index, message: messages[index].message });
  };

  // ฟังก์ชันเพื่อยกเลิกการแก้ไขข้อความ
  const handleCancelEdit = () => {
    setEditingMessage({ index: null, message: null });
  };

  // ✅ Set up WebSocket
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

        // ตรวจสอบว่าเป็นข้อความใหม่ที่ไม่ได้รับมาก่อน
        const isDuplicate = messages.some(
          (msg) =>
            msg.timestamp === data.timestamp &&
            msg.message === data.message &&
            msg.sender === data.sender
        );

        if (!isDuplicate) {
          setMessages((prev) => [
            ...prev,
            {
              sender: data.sender || 'Unknown',
              message: data.message,
              timestamp: data.timestamp || new Date().toLocaleTimeString(),
              message_id: data.message_id,
            },
          ]);
        } else {
          console.warn('⚠️ Duplicate message detected');
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

  // ✅ Fetch messages from the backend by roomChatId
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
            message_id: msg.id,  // Ensure message_id is correctly mapped
          }))
        );
      } catch (error) {
        console.error('❌ Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [roomChatId]);

  // ✅ Scroll to the latest message
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages.length]);

  // ✅ Send message
  const handleSendMessage = async () => {
    if (!socketRef.current || !newMessage.trim()) {
      console.warn('❌ Cannot send empty message');
      return;
    }

    const timestamp = new Date().toLocaleTimeString();

    // ✉️ Send message via WebSocket
    const messagePayload = {
      type: 'chat_message',
      bookingId,
      sender: 'Passenger',
      message: newMessage,
      timestamp,
      roomChatId,
    };

    console.log('📤 Sending message:', messagePayload);

    socketRef.current.send(JSON.stringify(messagePayload));
    setMessages((prev) => [
      ...prev,
      {
        sender: 'You',
        message: newMessage,
        timestamp,
        message_id: Date.now(),  // Create a temporary message_id for the front end
      },
    ]);

    // 💾 Send message to the backend
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
      room_id: Number(roomChatId),
    };

    console.log('📤 Sending message to backend:', backendMessage);

    const res = await sendMessageToBackend(backendMessage);

    // Log the response from the backend
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

  // ✅ Handle save edited message
  const handleSaveEdit = async () => {
    if (editingMessage.index !== null && editingMessage.message) {
      const updatedMessageContent = editingMessage.message.trim();

      if (!updatedMessageContent) {
        console.error('❌ Cannot save empty message');
        return;
      }

      const updatedMessages = [...messages];
      updatedMessages[editingMessage.index].message = updatedMessageContent;

      // Update message in frontend state
      setMessages(updatedMessages);

      const updatedMessage: UpdateMessage = {
        content: updatedMessageContent,
        message_id: updatedMessages[editingMessage.index]?.message_id,
      };

      // Send updated message to backend
      try {
        const resupdatemessage = await updateMessageToBackend(updatedMessage);
        console.log('Backend response:', resupdatemessage);
        if (resupdatemessage && resupdatemessage.data) {
          console.log('Message updated successfully on Backend:', resupdatemessage.data);
        } else {
          console.error('❌ Failed to update message on Backend');
        }
      } catch (error) {
        console.error('❌ Error updating message:', error);
      }

      setEditingMessage({ index: null, message: null });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      // ส่งคำขอลบไปยัง backend
      const success = await deleteMessageFromBackend(messageId); 
  
      // ถ้าการลบสำเร็จจาก backend
      if (success) {
        // ลบข้อความจาก state ใน frontend
        setMessages((prev) => prev.filter((msg) => msg.message_id !== Number(messageId)
      ));
        console.log('Message deleted successfully from backend');
      } else {
        console.error('❌ Failed to delete message from backend');
      }
    } catch (error) {
      console.error('❌ Error deleting message:', error);
    }
  };
  
  return (
    <div className="containerpassengerchat">
      <h1>💬 Chat with Driver</h1>
      <p><strong>Booking ID:</strong> {bookingId}</p>
      <p><strong>Driver ID:</strong> {driverId}</p>
      {isConnected ? (
        <p className="connected">🟢 Connected to Chat Room</p>
      ) : (
        <p className="disconnected">🔴 Disconnected from Chat Room</p>
      )}

      <div className="chatBox" ref={chatBoxRef}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === 'You' ? 'sender' : 'receiver'}`}
          >
            {editingMessage.index === index ? (
              <div>
                <label htmlFor="editMessage">Edit Message:</label>
                <input
                  id="editMessage"
                  type="text"
                  value={editingMessage.message || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingMessage({ ...editingMessage, message: e.target.value })
                  }
                />
                <button onClick={handleSaveEdit}>Save</button>
                <button onClick={handleCancelEdit}>Cancel</button>
              </div>
            ) : (
              <div>
                <p><strong>{msg.sender}:</strong> {msg.message}</p>
                <p className="timestamp">{msg.timestamp}</p>
                {msg.sender === 'You' && (
                  <>
                    <button onClick={() => handleEditMessage(index)}>Edit</button>
                    <button onClick={() => handleDeleteMessage(String(msg.message_id))}>Delete</button>

                  </>
                )}
              </div>
            )}
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
