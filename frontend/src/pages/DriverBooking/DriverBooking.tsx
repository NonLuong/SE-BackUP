// DriverBooking.tsx
import React, { useEffect, useState } from 'react';
import { getBookingById, acceptBooking } from '../../services/https'; // เพิ่ม acceptBooking

// 🛠️ กำหนดประเภทข้อมูลสำหรับการจอง
interface Booking {
  bookingId: number;
  startLocation: string;
  destination: string;
  bookingStatus: string;
  bookingTime: string;
}

// 🚗 DriverBooking Component
const DriverBooking: React.FC = () => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false); // สำหรับสถานะโหลดข้อมูล
  const driverID = 5; // แทนด้วย driverID ที่ได้จากระบบ Authentication

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
              bookingId: bookingDetails.id || bookingDetails.ID || 'Unknown', // รองรับ id หรือ ID
              startLocation: bookingDetails.beginning || 'Unknown',
              destination: bookingDetails.terminus || 'Unknown',
              bookingStatus: bookingDetails.booking_status || 'Unknown',
              bookingTime: bookingDetails.start_time
                ? new Date(bookingDetails.start_time).toLocaleString()
                : 'Unknown',
            });
            setLoading(false); // หยุดสถานะโหลด
          }
        } catch (error) {
          console.error('❌ Error processing message:', error);
          setLoading(false); // หยุดสถานะโหลดหากเกิดข้อผิดพลาด
        }
      };

      console.log('🔍 Booking State:', booking);

      
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
      socket.close();
    };
  }, []);

  const handleAcceptBooking = async () => {
    if (!booking || !booking.bookingId) {
      console.error('❌ Booking ID is missing');
      alert('❌ Booking ID is missing');
      return;
    }
    
    try {
      setLoading(true);
      const response = await acceptBooking(String(booking.bookingId));
      console.log(response)
  
      if (response.success) {
        alert('✅ Booking accepted successfully');
        setBooking(null); // รีเซ็ตสถานะการจอง
      } else {
        alert(`❌ Failed to accept booking: ${response.message}`);
      }
    } catch (error: any) {
      console.error('❌ Error accepting booking:', error.message || error);
      alert(`❌ Error: ${error.message || 'Failed to accept booking'}`);
    } finally {
      setLoading(false);
    }
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
  connected: {
    color: 'green',
  },
  disconnected: {
    color: 'red',
  },
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
    fontSize: '14px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};

export default DriverBooking;
