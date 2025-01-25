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

// ฟังก์ชันแปลงวันที่เป็นรูปแบบ yyyy-mm-dd (Local Time)
const formatDateToLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มต้นที่ 0
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ฟังก์ชันแปลงวันที่สำหรับแสดงผล (dd/mm/yyyy)
const formatDateForDisplay = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB'); // รูปแบบ dd/mm/yyyy
};

const BookingHistory = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCalendarVisible, setIsCalendarVisible] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isConfirmVisible, setIsConfirmVisible] = useState<boolean>(false);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const [bookingIdToUpdate, setBookingIdToUpdate] = useState<string | null>(null);
  const [isCancelPopupVisible, setIsCancelPopupVisible] = useState<boolean>(false);
  const [bookingIdToCancel, setBookingIdToCancel] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const data = await getPreBookings();
        setBookings(data);
      } catch (err) {
        setError('ไม่สามารถดึงข้อมูลการจองได้');
      } finally {
        setIsLoading(false);
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
        await deleteBooking(bookingIdToCancel);
        setBookings((prevBookings) =>
          prevBookings.filter((booking) => booking.ID !== bookingIdToCancel)
        );
        setSuccessMessage('Booking successfully canceled.');
        setIsCancelPopupVisible(false);
        setBookingIdToCancel(null);
      } catch (error) {
        setError('ไม่สามารถลบการจองได้');
      }
    }
  };

  const handleCancelPopupClose = () => {
    setIsCancelPopupVisible(false);
    setBookingIdToCancel(null);
  };

  const handleDateChange = (value: Date | Date[] | null) => {
    if (Array.isArray(value)) {
      console.warn("Multiple date selection is not supported.");
      return;
    }

    if (value) {
      setSelectedDate(value); // ตั้งค่าที่เลือก
      setPendingDate(value);
      setIsConfirmVisible(true);
    } else {
      console.warn("Invalid date selection.");
    }
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleConfirmDateChange = async () => {
    if (pendingDate && bookingIdToUpdate) {
      try {
        const formattedDate = formatDateToLocal(pendingDate); // ใช้ฟังก์ชันใหม่
        await updateBookingTime(bookingIdToUpdate, formattedDate);

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
        setSuccessMessage('Date successfully updated.');
      } catch (error) {
        setError('Cannot update booking date.');
      }
    }
  };

  const handleCancelDateChange = () => {
    setIsConfirmVisible(false);
    setPendingDate(null);
  };

  return (
    <div className="booking-page">
      <div className="page-header">
        <h1 className="page-title">MY PRE BOOKING</h1>
      </div>
      
        <div className="booking-list-container">
          {error && <p className="error-message">{error}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}
  
          {isLoading ? (
            <p>Loading bookings...</p>
          ) : bookings.length === 0 ? (
            <p>Don't have pre-booking</p>
          ) : (
            <ul>
              {bookings.map((booking, index) => (
                <li key={index} className="booking-item">
                  <div className="booking-item-header">
                    <h3>Trip #{index + 1}</h3>
                    <div className="booking-actions">
                      <button
                        onClick={() => handleEdit(booking.ID)}
                        className="edit-buttonbooking"
                      >
                        EDIT DATE
                      </button>
                      <button
                        onClick={() => handleCancel(booking.ID)}
                        className="cancel-buttonbooking"
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
  
                  <div className="opernbooking-details">
                    <img
                      src="mappp.PNG"
                      alt="Booking Banner"
                      className="banner-image"
                    />
                    <div className="booking-text">
                      <strong>START: </strong>
                      <span className="italic-text">{booking.beginning}</span>
                      <br />
                      <strong>DESTINATION: </strong>
                      < span className="italic-text">{booking.terminus}</span>
                      <br />
                      <strong>DATE: </strong>
                      < span className="italic-text">{formatDateForDisplay(booking.booking_time)}</span>
                      <br />
                      <strong>VEHICLE: </strong>
                      < span className="italic-text">{booking.vehicle}</span>
                      <br />
                      <strong>PRICE: </strong>
                      < span className="italic-text">{booking.total_price} THB </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
  
          {isCalendarVisible && (
            <div className="custom-popup-overlay">
              <div className="custom-popup">
                <h2>Choose date</h2>
                            <Calendar
              onChange={(value) =>
                handleDateChange(value as Date | Date[] | null)
              }
              value={selectedDate}
              tileDisabled={({ date }) => date < new Date()} // ปิดการคลิกวันที่ในอดีต
            />

  
                <button
                  onClick={() => setIsCalendarVisible(false)}
                  className="close-popup-button"
                >
                  CLOSE
                </button>
              </div>
            </div>
          )}
  
          {isConfirmVisible && pendingDate && (
            <div className="confirmation-popup-overlay">
              <div className="confirmation-popup">
                <h3>
                  Do you want to change the travel date to{' '}
                  {pendingDate.toLocaleDateString('en-GB')}?
                </h3>
                <button
                  onClick={handleConfirmDateChange}
                  className="confirm-button"
                >
                  CONFIRM
                </button>
                <button
                  onClick={handleCancelDateChange}
                  className="cancel-button"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
  
  {isCancelPopupVisible && (
  <div
    className="confirmation-popup-overlay"
    onClick={(e) => {
      if (e.target === e.currentTarget) {
        handleCancelPopupClose(); // ฟังก์ชันปิด popup
      }
    }}
  >
    <div className="confirmation-popup">
      <h3>Do you want to cancel this booking?</h3>
      <button
        onClick={handleConfirmCancel}
        className="confirm-button"
      >
        CONFIRM
      </button>
      <button
        onClick={handleCancelPopupClose}
        className="cancel-button"
      >
        CLOSE
      </button>
    </div>
  </div>
)}

        </div>
      </div>
   
  );
}  

export default BookingHistory;
