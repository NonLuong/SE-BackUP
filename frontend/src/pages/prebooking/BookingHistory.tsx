import { useEffect, useState } from 'react';
import { getPreBookings, updateBookingTime, deleteBooking } from '../../services/https/prebooking/prebooking';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './BookingHistory.css';

interface Booking {
  ID: string;
  beginning: string;
  terminus: string;
  booking_time: string;
  vehicle: string;
  total_price: number;
}

const BookingHistory = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [isCalendarVisible, setIsCalendarVisible] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isConfirmVisible, setIsConfirmVisible] = useState<boolean>(false);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const [bookingIdToUpdate, setBookingIdToUpdate] = useState<string | null>(null);
  const [isCancelPopupVisible, setIsCancelPopupVisible] = useState<boolean>(false);
  const [bookingIdToCancel, setBookingIdToCancel] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await getPreBookings();
        setBookings(data);
      } catch (err) {
        setError('ไม่สามารถดึงข้อมูลการจองได้');
      }
    };

    fetchBookings();
  }, []);

  const handleEdit = (bookingId: string) => {
    setBookingIdToUpdate(bookingId);
    setIsCalendarVisible(true);
  };

  const handleCancel = (bookingId: string) => {
    setBookingIdToCancel(bookingId);
    setIsCancelPopupVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (bookingIdToCancel) {
      try {
        await deleteBooking(bookingIdToCancel); // เรียก API เพื่อลบข้อมูล
        console.log('Deleted booking:', bookingIdToCancel);
  
        // อัปเดต state เพื่อลบ booking ออกจากรายการ
        setBookings((prevBookings) =>
          prevBookings.filter((booking) => booking.ID !== bookingIdToCancel)
        );
  
        setIsCancelPopupVisible(false);
        setBookingIdToCancel(null);
      } catch (error) {
        console.error('Error deleting booking:', error);
        setError('ไม่สามารถลบการจองได้');
      }
    }
  };
  

  const handleCancelPopupClose = () => {
    setIsCancelPopupVisible(false);
    setBookingIdToCancel(null);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setPendingDate(date);
    setIsConfirmVisible(true);
  };

  const handleConfirmDateChange = async () => {
    if (pendingDate && bookingIdToUpdate) {
      try {
        const formattedDate = pendingDate.toISOString().split('T')[0];
        const updatedBooking = await updateBookingTime(bookingIdToUpdate, formattedDate);

        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.ID === bookingIdToUpdate
              ? { ...booking, booking_time: formattedDate }
              : booking
          )
        );

        setIsConfirmVisible(false);
        setIsCalendarVisible(false);
        setBookingIdToUpdate(null);

        setEditMessage('วันที่การจองถูกเปลี่ยนเรียบร้อยแล้ว');
      } catch (error) {
        setError('ไม่สามารถอัปเดตวันจองได้');
      }
    }
  };

  const handleCancelDateChange = () => {
    setIsConfirmVisible(false);
    setPendingDate(null);
  };

  return (
    <div className="booking-list-container">
      <h1>ประวัติการจองล่วงหน้า</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {editMessage && <p style={{ color: 'green' }}>{editMessage}</p>}

      {bookings.length === 0 ? (
        <p>ไม่มีการจองที่เป็น pre-booking</p>
      ) : (
        <ul>
          {bookings.map((booking, index) => (
            <li key={index} className="booking-item">
              <div className="booking-actions">
                <button onClick={() => handleEdit(booking.ID)} className="edit-button">แก้ไข</button>
                <button onClick={() => handleCancel(booking.ID)} className="cancel-button">ยกเลิก</button>
              </div>
              <strong>เริ่มต้น: </strong>{booking.beginning}<br />
              <strong>จุดหมาย: </strong>{booking.terminus}<br />
              <strong>วันที่จอง: </strong>{booking.booking_time}<br />
              <strong>การเดินทาง: </strong>{booking.vehicle}<br />
              <strong>ราคา: </strong>{booking.total_price} บาท
            </li>
          ))}
        </ul>
      )}

      {isCalendarVisible && (
        <div className="custom-popup-overlay">
          <div className="custom-popup">
            <h2>เลือกวันที่ใหม่</h2>
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
            />
            <button onClick={() => setIsCalendarVisible(false)} className="close-popup-button">ปิด</button>
          </div>
        </div>
      )}

      {isConfirmVisible && pendingDate && (
        <div className="confirmation-popup-overlay">
          <div className="confirmation-popup">
            <h3>คุณต้องการเปลี่ยนวันที่การเดินทางเป็นวันที่ {pendingDate.toLocaleDateString()} หรือไม่?</h3>
            <button onClick={handleConfirmDateChange} className="confirm-button">ยืนยัน</button>
            <button onClick={handleCancelDateChange} className="cancel-button">ยกเลิก</button>
          </div>
        </div>
      )}

      {isCancelPopupVisible && (
        <div className="confirmation-popup-overlay">
          <div className="confirmation-popup">
            <h3>คุณต้องการยกเลิกการจองนี้หรือไม่?</h3>
            <button onClick={handleConfirmCancel} className="confirm-button">ยืนยัน</button>
            <button onClick={handleCancelPopupClose} className="cancel-button">ปิด</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingHistory;
