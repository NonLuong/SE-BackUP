const apiUrl = "http://localhost:8080";


// 📝 Interface สำหรับ RoomChat
interface RoomChat {
    booking_id: number;    // รหัสการจอง
    passenger_id: number;  // รหัสผู้โดยสาร
    driver_id: number;     // รหัสคนขับ
  }
  
  export async function createRoomChat(data: RoomChat) {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  
    try {
      const res = await fetch(`${apiUrl}/roomchat`, requestOptions);
  
      if (res.ok) {
        const result = await res.json();
        console.log("✅ RoomChat created successfully:", result);
        return result; // ตรวจสอบว่ามี room_chat_id ใน response
      } else {
        console.error("❌ Failed to create RoomChat:", res.statusText);
        return null;
      }
    } catch (error) {
      console.error("❌ Error creating RoomChat:", error);
      return null;
    }
  }
  

  interface DriverNameResponse {
    firstname: string;
    lastname: string;
    success: boolean;
  }
  
  // ฟังก์ชันดึงชื่อคนขับ
  export async function getDriverName(driverId: number): Promise<DriverNameResponse | null> {
    try {
      const response = await fetch(`${apiUrl}/drivers/${driverId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
  
      if (response.ok) {
        const result: DriverNameResponse = await response.json();
        console.log("✅ Fetched driver name successfully:", result);
        return result;
      } else {
        console.error("❌ Failed to fetch driver name:", response.statusText);
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching driver name:", error);
      return null;
    }
  }
  

  // ฟังก์ชันสำหรับอัปเดต driver_status_id
  export const updateDriverStatus = async (driverId: number, statusId: number): Promise<any> => {
    try {
      const response = await fetch(`${apiUrl}/driver/active/${driverId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ driver_status_id: statusId }), // ส่งค่า driver_status_id ใน body
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update driver status");
      }
  
      return await response.json();
    } catch (error: any) {
      console.error("Error updating driver status:", error.message);
      throw error.message;
    }
  };
  