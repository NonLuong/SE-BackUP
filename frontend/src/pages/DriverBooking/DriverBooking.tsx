import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBookingById, acceptBooking, rejectBooking, notifyPassenger, updateDriverInBooking } from "../../services/https/booking";
import { createRoomChat, updateDriverStatus } from "../../services/https/Roomchat/roomchat";
import "./DriverBooking.css";

interface Booking {
  bookingId: number;
  startLocation: string;
  destination: string;
  bookingStatus: string;
  bookingTime: string;
  passengerId: number;
  roomChatId: number;
}

const DriverBooking: React.FC = () => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [driverID, setDriverID] = useState<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const rawDriverID = localStorage.getItem("id");

    // ตรวจสอบว่า Role ต้องเป็น Driver เท่านั้น
    if (storedRole === "Driver" && rawDriverID) {
      setDriverID(Number(rawDriverID));
      console.log("🚗 Retrieved DriverID:", rawDriverID);
    } else {
      console.error("❌ This page is only accessible for Drivers.");
      alert("❌ You are not authorized to access this page.");
      navigate("/login"); // Redirect ผู้ใช้กลับไปหน้า login
    }
  }, [navigate]);

  useEffect(() => {
    if (!driverID) return; // ออกจาก useEffect หากไม่มี driverID

    let socket: WebSocket;

    const connectWebSocket = () => {
      socket = new WebSocket(`ws://localhost:8080/ws/driver/${driverID}`);

      socket.onopen = () => {
        console.log("✅ WebSocket connected");
        setIsConnected(true);
      };

      socket.onmessage = async (event) => {
        console.log("📩 Received message:", event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === "new_booking" && data.bookingId) {
            setLoading(true);
            const bookingDetails = await getBookingById(String(data.bookingId));
            setBooking({
              bookingId: bookingDetails.id || bookingDetails.ID || "Unknown",
              startLocation: bookingDetails.beginning || "Unknown",
              destination: bookingDetails.terminus || "Unknown",
              bookingStatus: bookingDetails.booking_status || "Unknown",
              bookingTime: bookingDetails.start_time
                ? new Date(bookingDetails.start_time).toLocaleString()
                : "Unknown",
              passengerId: bookingDetails.passenger_id,
              roomChatId: bookingDetails.room_chat_id,
            });
            setLoading(false);
          }
        } catch (error) {
          console.error("❌ Error processing message:", error);
          setLoading(false);
        }
      };

      socket.onclose = () => {
        console.log("🔌 WebSocket disconnected, attempting to reconnect...");
        setIsConnected(false);
        setTimeout(connectWebSocket, 5000);
      };

      socket.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
      };
    };

    connectWebSocket();

    return () => {
      if (socket) socket.close();
    };
  }, [driverID]);

  const handleAcceptBooking = async () => {
    if (!booking || !booking.bookingId || !booking.passengerId || !driverID) {
      console.error("❌ Missing Booking ID, Passenger ID, or DriverID");
      alert("❌ Missing Booking ID, Passenger ID, or DriverID");
      return;
    }

    try {
      setLoading(true);
      const response = await acceptBooking(String(booking.bookingId));

      if (response.success) {
        alert("✅ Booking accepted successfully");

        const updateDriverResponse = await updateDriverInBooking(booking.bookingId, driverID);
        if (updateDriverResponse.success) {
          console.log("✅ DriverID updated in booking:", updateDriverResponse);
        }

        const updateDriverStatusResponse = await updateDriverStatus(driverID, 3);
        if (updateDriverStatusResponse.success) {
          console.log("✅ Driver status updated");
        }

        const roomChatResponse = await createRoomChat({
          booking_id: booking.bookingId,
          passenger_id: booking.passengerId,
          driver_id: driverID,
        });

        if (roomChatResponse?.id) {
          console.log("✅ RoomChat created with ID:", roomChatResponse.id);
          setBooking((prev) => ({
            ...prev!,
            roomChatId: roomChatResponse.id,
          }));

          const notifyResponse = await notifyPassenger(
            String(booking.passengerId),
            String(driverID),
            String(booking.bookingId),
            `Your driver has accepted the booking (ID: ${booking.bookingId})`,
            String(roomChatResponse.id)
          );

          if (notifyResponse.success) {
            alert("✅ Passenger notified successfully");
          }
        }
      } else {
        alert(`❌ Failed to accept booking: ${response.message}`);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      alert("❌ Error accepting booking");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectBooking = async () => {
    if (!booking || !booking.bookingId || !driverID) {
      console.error("❌ Missing Booking ID or DriverID");
      alert("❌ Missing Booking ID or DriverID");
      return;
    }

    try {
      setLoading(true);
      const response = await rejectBooking(String(booking.bookingId));

      if (response.success) {
        alert("✅ Booking rejected successfully");
        navigate("/DriverBooking");
      } else {
        alert(`❌ Failed to reject booking: ${response.message}`);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      alert("❌ Error rejecting booking");
    } finally {
      setLoading(false);
    }
  };

  const handleChatWithPassenger = () => {
    if (!booking?.bookingId || !booking?.passengerId || !booking?.roomChatId) {
      alert("❌ Missing Booking ID, Passenger ID, or RoomChat ID");
      return;
    }

    navigate("/DriverChat", {
      state: {
        bookingId: booking.bookingId,
        passengerId: booking.passengerId,
        driverID,
        roomChatId: booking.roomChatId,
      },
    });
  };

  return (
    <div className="driverbooking">
      <h1>🚗 Driver Booking Page</h1>
      {isConnected ? (
        <p className="connected">🟢 WebSocket Connected</p>
      ) : (
        <p className="disconnected">🔴 WebSocket Disconnected</p>
      )}

      {loading ? (
        <p>⏳ Loading booking details...</p>
      ) : booking ? (
        <div className="bookingCard">
          <h2>📦 New Booking Received!</h2>
          <p>
            <strong>Booking ID:</strong> {booking.bookingId}
          </p>
          <p>
            <strong>Start Location:</strong> {booking.startLocation}
          </p>
          <p>
            <strong>Destination:</strong> {booking.destination}
          </p>
          <p>
            <strong>Time:</strong> {booking.bookingTime}
          </p>
          <button className="acceptButton" onClick={handleAcceptBooking}>
            Accept Booking
          </button>
          <button className="rejectButton" onClick={handleRejectBooking}>
            Reject Booking
          </button>
          <button className="chatButton" onClick={handleChatWithPassenger}>
            💬 Chat with Passenger
          </button>
        </div>
      ) : (
        <p>⏳ Waiting for new bookings...</p>
      )}
    </div>
  );
};

export default DriverBooking;
