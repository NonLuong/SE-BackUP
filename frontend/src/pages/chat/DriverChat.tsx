import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  sendMessageToBackend,
  getMessagesByRoomChatId,
  Message,
} from "../../services/https/booking";
import { FaCar } from "react-icons/fa";
import { finishBooking } from "../../services/https/statusbooking/statusbooking";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../config/ApiService";
import { Endpoint } from "../../config/Endpoint";
// 🛠️ ประเภทของข้อความในแชท
interface ChatMessage {
  sender: string;
  message: string;
  timestamp: string;
}

// 🚗 DriverChat Component
const DriverChat: React.FC = () => {
  const location = useLocation();
  const { bookingId, passengerId, driverID, roomChatId } = location.state || {};

  console.log("🛠️ Location State:", {
    bookingId,
    passengerId,
    driverID,
    roomChatId,
  });
  const navigate = useNavigate(); // เรียกใช้ useNavigate
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // ✅ ตั้งค่า WebSocket
  useEffect(() => {
    if (!bookingId || socketRef.current) return; // ป้องกันการเชื่อมต่อซ้ำซ้อน

    const ws = new WebSocket(`ws://localhost:8080/ws/chat/driver/${bookingId}`);

    ws.onopen = () => {
      console.log("✅ Connected to Chat Room:", bookingId);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.sender !== "You") {
          setMessages((prev) => {
            const isDuplicate = prev.some(
              (msg) =>
                msg.timestamp === data.timestamp &&
                msg.message === data.message &&
                msg.sender === data.sender
            );

            if (isDuplicate) {
              console.warn("⚠️ Duplicate message detected");
              return prev;
            }

            return [
              ...prev,
              {
                sender: data.sender || "Unknown",
                message: data.message,
                timestamp: data.timestamp || new Date().toLocaleTimeString(),
              },
            ];
          });
        }
      } catch (error) {
        console.error("❌ Error parsing message:", error);
      }
    };

    ws.onclose = () => {
      console.warn("🔌 WebSocket disconnected. Reconnecting in 5 seconds...");
      setIsConnected(false);
      socketRef.current = null;
      setTimeout(() => {
        if (!socketRef.current) {
          socketRef.current = new WebSocket(
            `ws://localhost:8080/ws/chat/driver/${bookingId}`
          );
        }
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    socketRef.current = ws;

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [bookingId]);

  // ✅ ดึงข้อความจาก Backend ตาม roomChatId
  useEffect(() => {
    const fetchMessages = async () => {
      if (!roomChatId) {
        console.warn("❌ Missing RoomChatId for fetching messages");
        return;
      }

      try {
        const fetchedMessages = await getMessagesByRoomChatId(
          String(roomChatId)
        );
        console.log("✅ Fetched Messages:", fetchedMessages);
        setMessages(
          fetchedMessages.map((msg: any) => ({
            sender: msg.sender_type,
            message: msg.content,
            timestamp: msg.send_time,
          }))
        );
      } catch (error) {
        console.error("❌ Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [roomChatId]);

  // ✅ Scroll ไปยังข้อความล่าสุด
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // ป้องกันการ submit form แบบเดิม
      handleSendMessage(); // เรียกใช้ฟังก์ชันส่งข้อความ
    }
  };

  // ✅ ส่งข้อความ
  const handleSendMessage = async () => {
    if (!socketRef.current || !newMessage.trim()) {
      console.warn("❌ Cannot send empty message");
      return;
    }

    const timestamp = new Date().toLocaleTimeString();

    // ✉️ ส่งข้อความไปยัง WebSocket
    const messagePayload = {
      type: "chat_message",
      bookingId,
      sender: "Driver",
      message: newMessage,
      timestamp,
    };

    console.log("📤 Sending message:", messagePayload);

    socketRef.current.send(JSON.stringify(messagePayload));
    setMessages((prev) => [
      ...prev,
      {
        sender: "You",
        message: newMessage,
        timestamp,
      },
    ]);

    // 💾 ส่งข้อความไปยัง Backend
    const backendMessage: Message = {
      content: newMessage,
      message_type: "text",
      read_status: false,
      send_time: new Date().toISOString(),
      passenger_id: Number(passengerId),
      booking_id: Number(bookingId),
      driver_id: Number(driverID),
      sender_id: Number(driverID),
      sender_type: "Driver",
      room_id: Number(roomChatId),
    };

    const res = await sendMessageToBackend(backendMessage);
    if (!res) {
      console.error("❌ Failed to save message to backend");
    }

    setNewMessage("");
  };

  const handleEndJob = async () => {
    const notifyPayment = {
      id: String(bookingId),
      message: "update",
      driverID: String(driverID),
    };
    apiRequest("POST", Endpoint.PAYMENT_NOTIFY, notifyPayment);
    try {
      if (!bookingId || !driverID) {
        alert("❌ Missing Booking ID or Driver ID");
        return;
      }

      // ✨ เรียก Service เพื่อส่งคำขอไปยัง Backend
      const result = await finishBooking(String(bookingId), Number(driverID));

      if (result.success) {
        alert("✅ Booking has been completed successfully");
        navigate("/Dashboards");
        // เปลี่ยนเส้นทางหรือรีเฟรชหน้า
        window.location.reload();
      } else {
        alert(`❌ Failed to finish the booking: ${result.message}`);
      }
    } catch (error: any) {
      console.error("❌ Error completing the booking:", error.message || error);
      alert(`❌ Error: ${error.message || "Unknown error occurred"}`);
    }
  };

  return (
    <div style={styles.container}>
      <h1>💬 Chat with Passenger</h1>
      <div style={styles.topRightButtonContainer}>
        <button
          style={styles.endButton}
          onClick={handleEndJob} // เรียกฟังก์ชันเมื่อกดปุ่ม
        >
          FINISH
        </button>
      </div>
      {/* <p><strong>Booking ID:</strong> {bookingId}</p>
      <p><strong>Passenger ID:</strong> {passengerId}</p> */}
      {isConnected ? (
        <p style={styles.connected}>🟢 Connected to Chat Room</p>
      ) : (
        <p style={styles.disconnected}>🔴 Disconnected from Chat Room</p>
      )}

      <div style={styles.chatBox} ref={chatBoxRef}>
        <FaCar style={styles.iconBackground} />
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              alignSelf: msg.sender === "You" ? "flex-end" : "flex-start",
              backgroundColor: msg.sender === "You" ? "#d1e7dd" : "#f8d7da",
            }}
          >
            <p>
              <strong>{msg.sender}:</strong> {msg.message}
            </p>
            <p style={styles.timestamp}>{msg.timestamp}</p>
          </div>
        ))}
      </div>

      <div style={styles.inputSection}>
        <input
          style={styles.input}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown} // กด Enter เพื่อส่งข้อความ
          placeholder="Type your message..."
        />
        <button
          style={styles.sendButton}
          onClick={handleSendMessage} // คลิกปุ่มเพื่อส่งข้อความ
        >
          ➤
        </button>
      </div>
    </div>
  );
};

// 🎨 Styles
const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    textAlign: "center" as const,
    width: "100vw", // กว้างเต็มหน้าจอ
    height: "100vh", // สูงเต็มหน้าจอ
    margin: "0",
    display: "flex",
    flexDirection: "column" as const, // จัด layout เป็นแนวตั้ง
    backgroundColor: "rgb(202, 197, 249)",
    color: "#000",
  },
  connected: {
    color: "green",
    fontWeight: "bold",
  },
  disconnected: {
    color: "red",
    fontWeight: "bold",
  },
  chatBox: {
    flex: 1, // ให้ขยายเต็มพื้นที่ระหว่าง header และ input section
    overflowY: "scroll" as const,
    border: "1px solid #ddd",
    padding: "10px",
    borderRadius: "5px",
    backgroundColor: "#d9d7ef",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    color: "#000",
  },
  message: {
    padding: "8px 12px",
    borderRadius: "8px",
    maxWidth: "70%",
    wordWrap: "break-word" as const,
    color: "#000",
  },
  topRightButtonContainer: {
    position: "absolute", // ใช้ absolute เพื่อวางตำแหน่งปุ่ม
    top: "10px", // ระยะจากด้านบน
    right: "10px", // ระยะจากด้านขวา
  },
  endButton: {
    padding: "10px 20px",
    backgroundColor: "rgb(232 49 16)", // สีแดงส้ม
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  timestamp: {
    fontSize: "10px",
    color: "#666",
    marginTop: "4px",
  },
  inputSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "10px",
    backgroundColor: "#D1C4E9",
    borderTop: "1px solid #ccc",
  },
  input: {
    flex: 1,
    padding: "12px 15px",
    borderRadius: "25px",
    border: "1px solid #ccc",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "#fff",
    color: "#000",
  },
  sendButton: {
    padding: "10px 15px",
    backgroundColor: "#9575CD",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "50px",
    height: "50px",
  },
  iconBackground: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    fontSize: "250px",
    color: "#f0f0f0",
    transform: "translate(-50%, -50%)",
    zIndex: 0,
  },
};

export default DriverChat;
