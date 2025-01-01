import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // เพิ่ม useNavigate
import { getBookingById, acceptBooking, notifyPassenger } from '../../services/https';

// 🛠️ กำหนดประเภทข้อมูลสำหรับการจอง
interface Booking {
  bookingId: number;
  startLocation: string;
  destination: string;
  bookingStatus: string;
  bookingTime: string;
  passengerId: number;
}

// 🚗 DriverBooking Component
const DriverBooking: React.FC = () => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false); // สำหรับสถานะโหลดข้อมูล
  const driverID = 5; // แทนด้วย driverID ที่ได้จากระบบ Authentication

  const navigate = useNavigate(); // สำหรับเปลี่ยนหน้า

  useEffect(() => {
    let socket: WebSocket;

    const connectWebSocket = () => {
      socket = new WebSocket(`ws://localhost:8080/ws/driver/${driverID}`);

      socket.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
      };

      socket.onmessage = async (event) => {
        console.log('📩 Received message:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_booking' && data.bookingId) {
            setLoading(true); // เริ่มสถานะโหลด
            const bookingDetails = await getBookingById(String(data.bookingId));
            console.log('🔍 Booking Details from API:', bookingDetails);

            setBooking({
              bookingId: bookingDetails.id || bookingDetails.ID || 'Unknown',
              startLocation: bookingDetails.beginning || 'Unknown',
              destination: bookingDetails.terminus || 'Unknown',
              bookingStatus: bookingDetails.booking_status || 'Unknown',
              bookingTime: bookingDetails.start_time
                ? new Date(bookingDetails.start_time).toLocaleString()
                : 'Unknown',
              passengerId: bookingDetails.passenger_id,
            });
            setLoading(false);
          }
        } catch (error) {
          console.error('❌ Error processing message:', error);
          setLoading(false);
        }
      };

      socket.onclose = () => {
        console.log('🔌 WebSocket disconnected, attempting to reconnect...');
        setIsConnected(false);
        setTimeout(connectWebSocket, 5000); // ลองเชื่อมต่อใหม่หลัง 5 วินาที
      };

      socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (socket) socket.close();
    };
  }, []);

  const handleAcceptBooking = async () => {
    if (!booking || !booking.bookingId || !booking.passengerId) {
      console.error('❌ Booking ID or Passenger ID is missing');
      alert('❌ Booking ID or Passenger ID is missing');
      return;
    }
  
    try {
      setLoading(true);
  
      // 🚗 1. ยืนยันการรับงาน
      const response = await acceptBooking(String(booking.bookingId));
  
      if (response.success) {
        alert('✅ Booking accepted successfully');
  
        // 🐞 Debug ค่าที่จะส่งไปยัง `notifyPassenger`
        console.log('📲 Sending notification with the following details:');
        console.log('🆔 Passenger ID:', booking.passengerId);
        console.log('🚗 Driver ID:', driverID);
        console.log('📝 Message:', `Your driver has accepted the booking (ID: ${booking.bookingId}) and is on the way!`);
        console.log('📦 Booking ID:', booking.bookingId);
  
        // 📲 2. แจ้งผู้โดยสารผ่าน API
        const notifyResponse = await notifyPassenger(
          String(booking.passengerId),
          String(driverID),
          String(booking.bookingId),
          `Your driver has accepted the booking (ID: ${booking.bookingId}) and is on the way!`
        );
  
        console.log('✅ Notification API Response:', notifyResponse);
  
        if (notifyResponse.success) {
          alert('✅ Notification sent to passenger!');
        } else {
          console.error('❌ Failed to notify passenger via API');
        }
      } else {
        alert(`❌ Failed to accept booking: ${response.message}`);
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message || error);
      alert(`❌ Error: ${error.message || 'Failed to accept booking'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleChatWithPassenger = () => {
    if (!booking?.bookingId || !booking?.passengerId) {
      alert('❌ Missing Booking ID or Passenger ID');
      return;
    }

    navigate('/DriverChat', {
      state: {
        bookingId: booking.bookingId,
        passengerId: booking.passengerId,
        driverID
      },
    });
  };

  return (
    <div style={styles.container}>
      <h1>🚗 Driver Booking Page</h1>
      {isConnected ? (
        <p style={styles.connected}>🟢 WebSocket Connected</p>
      ) : (
        <p style={styles.disconnected}>🔴 WebSocket Disconnected</p>
      )}

      {loading ? (
        <p>⏳ Loading booking details...</p>
      ) : booking ? (
        <div style={styles.bookingCard}>
          <h2>📦 New Booking Received!</h2>
          <p><strong>Booking ID:</strong> {booking.bookingId}</p>
          <p><strong>Start Location:</strong> {booking.startLocation}</p>
          <p><strong>Destination:</strong> {booking.destination}</p>
          <p><strong>Status:</strong> {booking.bookingStatus}</p>
          <p><strong>Time:</strong> {booking.bookingTime}</p>
          <button style={styles.acceptButton} onClick={handleAcceptBooking}>
            ✅ Accept Booking
          </button>
          <button style={styles.chatButton} onClick={handleChatWithPassenger}>
            💬 Chat with Passenger
          </button>
        </div>
      ) : (
        <p>⏳ Waiting for new bookings...</p>
      )}
    </div>
  );
};

// 🎨 CSS-in-JS Styles
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
    color: '#000',
  },
  connected: { color: 'green' },
  disconnected: { color: 'red' },
  bookingCard: {
    marginTop: '20px',
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
  },
  acceptButton: {
    marginTop: '10px',
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: '#fff',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  chatButton: {
    marginTop: '10px',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: '#fff',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};

export default DriverBooking;
