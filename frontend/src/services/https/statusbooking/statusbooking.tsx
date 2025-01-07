const apiUrl = "http://localhost:8080";

/*export async function createBookingStatus(
  statusBooking: string, // กำหนดชนิดข้อมูลเป็น string
  bookingID: number // กำหนดชนิดข้อมูลเป็น number
): Promise<any> {
  try {
    const response = await fetch(`${apiUrl}/bookingstatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status_booking: statusBooking,
        booking_id: bookingID,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Booking status created:', data);
    return data;
  } catch (error) {
    console.error('Failed to create booking status:', error);
    throw error;
  }
}*/

export const sendBookingStatusToBackend = async (bookingStatusData: any): Promise<any> => {
    try {
      const response = await fetch(`${apiUrl}/bookingstatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingStatusData),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to send booking status. Status: ${response.status}`);
      }
  
      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('Error sending booking status:', error);
      const err = error as Error; // แปลงเป็น Error
      return { success: false, message: err.message };
    }
  };
  

  export async function patchBookingStatus(
    statusBooking: string,
    bookingID: number
  ): Promise<any> {
    try {
      const response = await fetch(`${apiUrl}/bookingstatus/${bookingID}`, {
        method: "PATCH", // ใช้ PATCH สำหรับอัปเดตบางส่วน
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status_booking: statusBooking, // ระบุสถานะใหม่ที่ต้องการอัปเดต
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to update booking status. HTTP status: ${response.status}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error in patchBookingStatus:", error);
      throw error;
    }
  }