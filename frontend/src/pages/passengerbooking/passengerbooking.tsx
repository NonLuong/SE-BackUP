import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PassengerNotification: React.FC = () => {
  const [message, setMessage] = useState<string>('🔔 Waiting for notifications...');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [roomChatId, setRoomChatId] = useState<string | null>(null);

  const passengerId = '1';
  const navigate = useNavigate();

  // ✅ เชื่อมต่อ WebSocket
  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectInterval: ReturnType<typeof setTimeout>;

    const connectWebSocket = () => {
      socket = new WebSocket(`ws://localhost:8080/ws/passenger/${passengerId}`);

      socket.onopen = () => {
        console.log('✅ WebSocket connected (Passenger Notification)');
        setIsConnected(true);
        setMessage('✅ WebSocket connected');
      };

      socket.onmessage = (event) => {
        console.log('📩 Message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification') {
            setMessage(`🚨 ${data.message}`);

            if (data.bookingId) {
              console.log('✅ BookingId Received:', data.bookingId);
              setBookingId(data.bookingId);
            } else {
              console.warn('⚠️ No bookingId in the notification');
            }

            if (data.driverId) {
              console.log('✅ DriverId Received:', data.driverId);
              setDriverId(data.driverId);
            } else {
              console.warn('⚠️ No driverId in the notification');
            }

            if (data.roomChatId) {
              console.log('✅ RoomChatId Received:', data.roomChatId);
              setRoomChatId(data.roomChatId);
            } else {
              console.warn('⚠️ No roomChatId in the notification');
            }
          } else {
            console.warn('⚠️ Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setMessage('❌ WebSocket connection error');
        setIsConnected(false);
      };

      socket.onclose = () => {
        console.warn('🔌 WebSocket disconnected');
        setMessage('🔌 WebSocket disconnected');
        setIsConnected(false);

        reconnectInterval = setTimeout(() => {
          console.log('🔄 Attempting to reconnect WebSocket...');
          connectWebSocket();
        }, 5000);
      };
    };

    connectWebSocket();

    return () => {
      if (socket) socket.close();
      if (reconnectInterval) clearTimeout(reconnectInterval);
    };
  }, [passengerId]);

  // ✅ ไปยังหน้าแชท
  const handleGoToChat = () => {
    console.log('🔗 Attempting to navigate with the following details:');
    console.log('🆔 BookingId:', bookingId);
    console.log('🚗 DriverId:', driverId);
    console.log('💬 RoomChatId:', roomChatId);
    if (bookingId && driverId && roomChatId) {
      console.log('🔗 Navigating to Chat with:', { bookingId, driverId, roomChatId });
      navigate('/PassengerChat', {
        state: {
          bookingId,
          passengerId,
          driverId,
          roomChatId,
        },
      });
    } else {
      console.error('❌ Missing bookingId, driverId, or roomChatId:', { bookingId, driverId, roomChatId });
      alert('❌ Missing bookingId, driverId, or roomChatId to start chat');
    }
  };

  return (
    <div style={styles.container}>
      <h1>🛎️ Passenger Notifications</h1>
      <div style={styles.status}>
        {isConnected ? (
          <p style={styles.connected}>🟢 WebSocket Connected</p>
        ) : (
          <p style={styles.disconnected}>🔴 WebSocket Disconnected</p>
        )}
      </div>
      <div style={styles.notificationBox}>
        <p>{message}</p>
      </div>
      <button
        style={{
          ...styles.chatButton,
          backgroundColor: bookingId && driverId && roomChatId ? '#007bff' : '#ccc',
          cursor: bookingId && driverId && roomChatId ? 'pointer' : 'not-allowed',
        }}
        onClick={handleGoToChat}
        disabled={!bookingId || !driverId || !roomChatId}
      >
        💬 Go to Chat
      </button>
    </div>
  );
};

// 🎨 CSS Styles
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    textAlign: 'center' as const,
    maxWidth: '400px',
    margin: 'auto',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    marginTop: '50px',
    backgroundColor: '#fff',
  },
  status: {
    marginTop: '10px',
    marginBottom: '10px',
    fontSize: '14px',
  },
  connected: {
    color: 'green',
    fontWeight: 'bold',
  },
  disconnected: {
    color: 'red',
    fontWeight: 'bold',
  },
  notificationBox: {
    marginTop: '20px',
    padding: '15px',
    borderRadius: '8px',
    backgroundColor: '#d1e7dd',
    color: '#0f5132',
    fontSize: '16px',
  },
  chatButton: {
    marginTop: '20px',
    padding: '10px 20px',
    fontSize: '14px',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
};

export default PassengerNotification;
