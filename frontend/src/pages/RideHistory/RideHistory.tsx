import React, { useEffect, useState } from "react";
import { getBookings } from "../../services/https/statusbooking/statusbooking";
import "./RideHistory.css";

type Booking = {
  id: number;
  beginning: string | null;
  terminus: string | null;
  start_time: string | null;
  end_time: string | null;
  distance: number | null;
  total_price: number | null;
  booking_status: string | null;
  vehicle: string | null;
};

const RideHistory: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await getBookings();
        console.log("Fetched bookings:", response);
        const formattedBookings = response.map((item: any) => ({
          id: item.booking.id,
          beginning: item.booking.beginning || "Data not available",
          terminus: item.booking.terminus || "Data not available",
          start_time: item.booking.start_time || null,
          end_time: item.booking.end_time || null,
          distance: item.booking.distance || 0,
          total_price: item.booking.total_price || 0,
          booking_status: item.status_booking || "unknown",
          vehicle: item.booking.vehicle || "Unknown vehicle",
        }));
        setBookings(formattedBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (loading) {
    return <div>Loading travel history...</div>;
  }

  return (
    <div className="ride-history-container">
      <div className="ride-history">
        <div className="header">TRAVEL HISTORY</div>
        <div className="ride-cards">
          {bookings.map((booking, index) => (
            <div key={booking.id} className="ride-card">
              <div className="ride-card-header">
                <h3>Trip #{index + 1}</h3>
                <span
                  className={`status ${booking.booking_status || "unknown"}`}
                >
                  {booking.booking_status || "Status unknown"}
                </span>
              </div>
              <div className="ride-card-body">
                <p>
                  <strong>Route:</strong>{" "}
                  {booking.beginning} to {booking.terminus}
                </p>
                <p>
                  <strong>Start Date:</strong>{" "}
                  {booking.start_time
                    ? new Date(booking.start_time).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Unknown date"}
                </p>
                <p>
                  <strong>Vehicle:</strong> {booking.vehicle}
                </p>
                <p>
                  <strong>Distance:</strong>{" "}
                  {booking.distance !== null
                    ? `${booking.distance} km`
                    : "Data not available"}
                </p>
                <p>
                  <strong>Total Fare:</strong>{" "}
                  {booking.total_price !== null
                    ? `${booking.total_price.toFixed(2)} THB`
                    : "Data not available"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RideHistory;
