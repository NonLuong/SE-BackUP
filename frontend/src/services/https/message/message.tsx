// Service function to update the message content in the backend
const apiUrl = "http://localhost:8080";

// แก้ไขประเภท Message
export interface Message {
  
  message_id?: number; // เปลี่ยนให้เป็น optional
  content: string;
  message_type: string;
  read_status: boolean;
  send_time: string;
  passenger_id: number;
  booking_id: number;
  driver_id: number;
  sender_id: number; // เพิ่ม SenderID
  sender_type: string; // เพิ่ม SenderType
  room_id: number;
}

// แก้ไขประเภท Message ให้เหมาะสมกับการอัปเดตเพียงบางฟิลด์
export interface UpdateMessage {
    content: string;
    message_id: number;
  }
  
  // ฟังก์ชันการอัปเดตข้อความที่ส่งแค่ content และ message_id
  export const updateMessageToBackend = async (updatedMessage: UpdateMessage) => {
    
    console.log("dojnfo4tuifke mrepvfr",updatedMessage)
    try {
      if (!updatedMessage.message_id) {
        throw new Error('Message ID is required for update');
      }
  
      const response = await fetch(`${apiUrl}/messages/update/${updatedMessage.message_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedMessage),  // ส่งแค่ content และ message_id
      });
  
      if (!response.ok) {
        throw new Error('Failed to update message');
      }
  
      const data = await response.json();
      return data; // Return the updated message or success response
    } catch (error) {
      console.error('❌ Error updating message:', error);
      return null;
    }
  };
  

  // Service function to delete a message from the backend
// Service function to delete a message from the backend
export const deleteMessageFromBackend = async (messageId: string) => {
    try {
      // ส่งคำขอลบข้อความไปยัง backend
      const response = await fetch(`${apiUrl}/messages/delete/${messageId}`, {
        method: 'DELETE', // ใช้ DELETE เพื่อกำจัดข้อมูล
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      // ตรวจสอบว่า response.ok คือ true (สถานะ 2xx)
      if (!response.ok) {
        throw new Error('Failed to delete message');
      }
  
      // ดึงข้อมูลที่ตอบกลับจาก backend
      const data = await response.json();
  
      // ตรวจสอบว่า backend ส่งข้อความที่แสดงว่าลบสำเร็จ
      if (data.message === 'Message deleted successfully') {
        console.log('Message deleted successfully:', data);
        return true;  // ส่งคืน true ถ้าลบสำเร็จ
      } else {
        console.error('❌ Failed to delete message:', data);
        return false;  // ถ้าไม่ใช่ข้อความสำเร็จ
      }
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      return false;  // ถ้ามีข้อผิดพลาดในการลบ
    }
  };
  