// URL ของ API ที่ Backend ให้บริการ
const apiUrl = "http://localhost:8080";


// ฟังก์ชันสำหรับดึงข้อมูลการจองที่เป็น pre-booking
export const getPreBookings = async () => {
  try {
    const response = await fetch(`${apiUrl}/prebookings`);

    // ตรวจสอบสถานะการตอบกลับจาก API
    if (!response.ok) {
      throw new Error('ไม่สามารถดึงข้อมูลการจองได้');
    }

    const data = await response.json();  // แปลงข้อมูลจาก JSON
    console.log("Pre-bookings fetched:", data);
    return data;  // ส่งข้อมูลการจองที่ได้รับจาก API
    
  } catch (error) {
    console.error('Error fetching pre-bookings:', error);
    throw error;  // หรือคุณสามารถจัดการข้อผิดพลาดในที่นี้ได้
  }
};

export const updateBookingTime = async (bookingId: string, bookingTime: string) => {
    console.log("bookingid",bookingId)
    console.log("bookingtime",bookingTime)
    try {
      // ส่งคำขอ PUT ไปยัง API โดยใช้ fetch
      const response = await fetch(`${apiUrl}/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ booking_time: bookingTime }), // ส่งข้อมูลใน body ของ request
      });
  
      // ตรวจสอบว่าการตอบกลับของ API สำเร็จ
      if (!response.ok) {
        throw new Error('Failed to update booking time');
      }
  
      // แปลงข้อมูลที่ได้รับจาก response เป็น JSON
      const data = await response.json();
  
      // คืนค่าผลลัพธ์ที่ได้รับจาก API
      return data;
    } catch (error) {
      // ถ้ามีข้อผิดพลาดในการเรียก API
      console.error('Error updating booking time:', error);
      throw error;  // ส่งข้อผิดพลาดออกไปให้สามารถจัดการในส่วนอื่นได้
    }
  };

  export const deleteBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`${apiUrl}/bookings/${bookingId}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        throw new Error('ไม่สามารถลบการจองได้');
      }
  
      return await response.json(); // ดึงข้อมูลผลลัพธ์ ถ้าจำเป็น
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  };
  