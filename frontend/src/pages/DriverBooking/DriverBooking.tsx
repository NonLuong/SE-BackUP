import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getBookingById, acceptBooking } from '../../services/https'; // ฟังก์ชันที่ใช้งานจาก services
import { Booking } from '../../interfaces/IBooking'; // นำเข้า interface Booking
import './DriverBooking.css';

const DriverBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId,  } = location.state || {}; // ดึง bookingId และ driverId จาก state ของหน้าอื่น
  const [booking, setBooking] = useState<Booking | null>(null); // กำหนดประเภทให้กับ booking
  const [message, setMessage] = useState<string | null>(null); // ใช้เก็บข้อความจาก WebSocket
  const driverId = 6; // ตัวอย่าง driver ID
  // ดึงข้อมูลการจองจาก Backend
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const data = await getBookingById(bookingId);
        console.log('Fetched booking data: ', data); // ตรวจสอบข้อมูลที่ดึงมา
        setBooking(data); // เซ็ตข้อมูลการจองใน state
      } catch (error) {
        console.error('Error fetching booking:', error);
        alert('ไม่สามารถดึงข้อมูลการจองได้');
      }
    };
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  // เชื่อมต่อ WebSocket
  let socket: WebSocket | null = null; // กำหนดชนิดข้อมูลเป็น WebSocket หรือ null

useEffect(() => {
  if (driverId) {
    socket = new WebSocket(`ws://localhost:8080/ws?room=${driverId}`);

    socket.onopen = () => {
      console.log(`WebSocket connected for driver ID: ${driverId}`);
    };

    socket.onmessage = (event) => {
      console.log("Raw WebSocket message received:", event.data);
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socket.onclose = (event) => {
      console.log(`WebSocket disconnected for driver ID: ${driverId}, Reason: ${event.reason}`);
    };
  }

  return () => {
    if (socket) {
      socket.close();
      console.log(`WebSocket closed for driver ID: ${driverId}`);
    }
  };
}, [driverId]);

  // Accept Booking logic
  const handleAcceptBooking = async () => {
    if (!booking) return;

    if (booking.booking_status !== 'Waiting for driver acceptance') {
      alert('สถานะการจองนี้ไม่สามารถรับได้');
      return;
    }

    try {
      const result = await acceptBooking(bookingId);
      if (result.success) {
        alert('คุณรับงานเรียบร้อยแล้ว');
        navigate('/driver-dashboard');
      } else {
        throw new Error(result.error || 'Failed to accept booking');
      }
    } catch (error) {
      console.error('Error accepting booking:', error);
      alert(error.message || 'ไม่สามารถรับงานได้');
    }
  };

  return (
    <div className="driver-booking">
      {booking ? (
        <div>
          <h2>Booking Details</h2>
          <p><strong>Start Location:</strong> {booking.beginning}</p>
          <p><strong>Destination:</strong> {booking.terminus}</p>
          <p><strong>Distance:</strong> {booking.distance} km</p>
          <p><strong>Fare:</strong> {booking.total_price} Baht</p>

          <div className="accept-btn-container">
            <button onClick={handleAcceptBooking}>Accept Booking</button>
          </div>

          {message && (
            <div className="message">
              <p><strong>Message:</strong> {message}</p> {/* แสดงข้อความที่ได้รับจาก WebSocket */}
            </div>
          )}
        </div>
      ) : (
        <p>Loading booking details...</p>
      )}
    </div>
  );
};

export default DriverBooking;
