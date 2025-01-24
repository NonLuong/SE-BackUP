import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DatePreBooking.css';
import { FaCalendarAlt } from 'react-icons/fa'; // นำเข้าไอคอน

const DatePreBooking: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const navigate = useNavigate();

  const handleConfirm = () => {
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString();
      const formattedTime = selectedDate.toLocaleTimeString();

      alert(`DATE ${formattedDate} TIME ${formattedTime}`);

      // ส่งค่าผ่าน state
      navigate('/map', { state: { date: formattedDate, time: formattedTime } });
      console.log('date', formattedDate);
    } else {
      alert('Please select a date and time!!');
    }
  };

  return (
    <div className="containerdate">
      <h1 className="header">Advance Booking</h1>
      <div className="banner">
        <img
          src="รูปคนชี้.png" // เปลี่ยน URL เป็นภาพของคุณ
          alt="Booking Banner"
          className="banner-image"
        />
      </div>

      {/* เพิ่มข้อความใต้รูป */}
      <div className="description-section">
        <FaCalendarAlt size={50} className="calendar-icon" />
        <p className="description-text">
        Plan Ahead Without Worries <br /> Choose a convenient date and time for your journey
        </p>
       
      </div>

      <div className="picker-section">
        <div className="picker-row">
          <div className="picker-item">
            <span className="picker-label">DATE</span>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date)}
              dateFormat="dd/MM/yyyy"
              className="date-picker"
            />
          </div>
          <div className="picker-item">
            <span className="picker-label">TIME</span>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date)}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="Time"
              dateFormat="h:mm aa"
              className="time-picker"
            />
          </div>
        </div>
      </div>

      <div className="button-section">
        <button className="confirm-button" onClick={handleConfirm}>
          Advance booking
        </button>
      </div>
    </div>
  );
};

export default DatePreBooking;
