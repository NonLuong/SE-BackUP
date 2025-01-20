import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DatePreBooking.css';

const DatePreBooking: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const navigate = useNavigate();

  const handleConfirm = () => {
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString();
      const formattedTime = selectedDate.toLocaleTimeString();
      
      alert(`คุณเลือกวันที่ ${formattedDate} เวลา ${formattedTime}`);
      
      // ส่งค่าผ่าน state
      navigate('/map', { state: { date: formattedDate, time: formattedTime } });
      console.log("date", formattedDate)
    } else {
      alert('กรุณาเลือกวันที่และเวลา!');
    }
  };

  return (
    <div className="containerdate">
      <h1 className="header">Advance Booking</h1>
      <div className="banner">
        <img
          src="รถถถถ.jpeg" // เปลี่ยน URL เป็นภาพของคุณ
          alt="Booking Banner"
          className="banner-image"
        />
      </div>

      <div className="picker-section">
        <div className="picker-row">
          <div className="picker-item">
            <span className="picker-label">วันที่</span>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date)}
              dateFormat="dd/MM/yyyy"
              className="date-picker"
            />
          </div>
          <div className="picker-item">
            <span className="picker-label">เวลา</span>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date)}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="เวลา"
              dateFormat="h:mm aa"
              className="time-picker"
            />
          </div>
        </div>
      </div>

      <div className="button-section">
        <button className="confirm-button" onClick={handleConfirm}>
          จองล่วงหน้า
        </button>
      </div>
    </div>
  );
};

export default DatePreBooking;
