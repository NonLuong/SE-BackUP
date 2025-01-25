import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleMap, DirectionsRenderer, Marker } from "@react-google-maps/api";
import { FaMotorcycle, FaCar, FaTruckPickup } from "react-icons/fa";
import "./MapRoute.css";
import { sendBookingToBackend, getVehicles } from "../../services/https/booking";
import { sendBookingStatusToBackend } from "../../services/https/statusbooking/statusbooking";
import { UserOutlined } from "@ant-design/icons";

// กำหนด Type สำหรับ Vehicle
type Vehicle = {
  ID: number;
  NameCar: string;
  BaseFare: number;
  PerKm: number;
  Capacity: number;
  VehicleType: {
    TypeName: string;
  };
  icon?: JSX.Element; // icon จะถูกเพิ่มในขั้นตอน mapping
};

const MapRoute: React.FC = () => {
  const location = useLocation();
  const { pickupLocation, startLocationId, destinationLocation, destinationId } = location.state || {};
  const navigate = useNavigate();

  const [isLoaded, setIsLoaded] = useState(false);
  const [directions, setDirections] = useState<any>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [fare, setFare] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { state } = useLocation();
  const { date, time } = state || {};

  // ดึงข้อมูล Passenger จาก localStorage
  const passengerId = localStorage.getItem("id");
  const userRole = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  console.log("JWT Token:", token);
  console.log("User Role:", userRole);
  console.log("Passenger ID:", passengerId);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const data = await getVehicles();
        console.log("Vehicles Data from API:", data.data); // ตรวจสอบข้อมูล API
  
        const vehiclesWithIcons = data.data.map((vehicle: any) => {
          const typeName = vehicle.VehicleType?.vehicle_type || "Unknown"; // ตรวจสอบ VehicleType
  
          return {
            ID: vehicle.id || vehicle.ID,
            NameCar: vehicle.name_car, // ใช้ name_car จากฐานข้อมูล
            BaseFare: vehicle.base_fare, // ใช้ base_fare จากฐานข้อมูล
            PerKm: vehicle.per_km, // ใช้ per_km จากฐานข้อมูล
            Capacity: vehicle.capacity, // ใช้ capacity จากฐานข้อมูล
            VehicleType: {
              TypeName: typeName,
            },
            icon:
              typeName === "Motorcycle" ? (
                <FaMotorcycle size={50} />
              ) : typeName === "Car" ? (
                <FaCar size={50} />
              ) : (
                <FaTruckPickup size={50} />
              ),
          };
        });
  
        console.log("Processed Vehicles with Icons:", vehiclesWithIcons); // Debugging
        setVehicles(vehiclesWithIcons);
      } catch (error) {
        console.error("Failed to fetch vehicles:", error);
      }
    };
  
    fetchVehicles();
  }, []);
  

  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      const existingScript = document.getElementById("google-maps-api");
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBS6cbuwvX1lbvMXV-1-E4Skg-9BzpYhGA&libraries=places`;
        script.id = "google-maps-api";
        script.async = true;
        script.onload = () => setIsLoaded(true);
        document.head.appendChild(script);
      } else {
        setIsLoaded(true);
      }
    };

    loadGoogleMapsAPI();
  }, []);

  useEffect(() => {
    if (pickupLocation && destinationLocation && isLoaded) {
      const directionsService = new window.google.maps.DirectionsService();

      const request = {
        origin: { lat: pickupLocation.lat, lng: pickupLocation.lng },
        destination: { lat: destinationLocation.lat, lng: destinationLocation.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      };

      directionsService.route(request, (result: any, status: any) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
          const distanceInMeters = result.routes[0].legs[0].distance.value;
          const distanceInKm = distanceInMeters / 1000;
          setDistance(distanceInKm);
        } else {
          console.error("Error fetching directions", status);
        }
      });
    }
  }, [pickupLocation, destinationLocation, isLoaded]);

  const handleSelectVehicle = (id: number) => {
    setSelectedVehicle(id);
    const selectedVehicleData = vehicles.find((v) => v.ID === id);

    if (distance !== null && selectedVehicleData) {
      const calculatedFare =
        !isNaN(selectedVehicleData.BaseFare) &&
        !isNaN(selectedVehicleData.PerKm) &&
        typeof selectedVehicleData.BaseFare === "number" &&
        typeof selectedVehicleData.PerKm === "number"
          ? selectedVehicleData.BaseFare + selectedVehicleData.PerKm * distance
          : null;
      setFare(calculatedFare);
    } else {
      console.error("Vehicle not found or distance is null");
    }
  };

  const handleBooking = async () => {
    if (!passengerId) {
      alert("Passenger ID not found in localStorage. Please log in again.");
      return;
    }

    if (!selectedVehicle || distance === null) {
      setSuccessMessage("กรุณาเลือกยานพาหนะและตรวจสอบข้อมูลให้ครบถ้วน");
      return;
    }

    if (!pickupLocation || !destinationLocation || !startLocationId || !destinationId) {
      setSuccessMessage("ข้อมูลสถานที่เริ่มต้นหรือจุดหมายปลายทางไม่ครบถ้วน");
      return;
    }

    let selectedDateTime: Date;
    const currentDateTime = new Date();

    if (!date || !time) {
      selectedDateTime = currentDateTime;
    } else {
      try {
        const formattedDate = date.split("/").reverse().join("-");
        selectedDateTime = new Date(`${formattedDate}T${time}`);
        if (isNaN(selectedDateTime.getTime())) {
          throw new Error("รูปแบบวันที่หรือเวลาไม่ถูกต้อง");
        }
      } catch (error) {
        alert("รูปแบบวันที่หรือเวลาไม่ถูกต้อง");
        return;
      }
    }

    const isFutureBooking = selectedDateTime > currentDateTime;

    const selectedVehicleData = vehicles.find((v) => v.ID === selectedVehicle);

    const bookingData: any = {
      beginning: pickupLocation.name || "",
      terminus: destinationLocation.name || "",
      start_time: selectedDateTime.toISOString(),
      end_time: "",
      distance: parseFloat(distance.toFixed(2)),
      total_price: parseFloat(fare?.toFixed(2) || "0"),
      booking_time: currentDateTime.toISOString(),
      vehicle: selectedVehicleData?.NameCar || "",
      start_location_id: startLocationId,
      destination_id: destinationId,
      passenger_id: parseInt(passengerId, 10),
      ispre_booking: isFutureBooking,
      reminder_time: isFutureBooking
        ? new Date(selectedDateTime.getTime() - 15 * 60 * 1000).toISOString()
        : null,
      notes: isFutureBooking ? "Pre-booking made by passenger" : "Current booking",
    };

    console.log("Reminder Time:", bookingData.reminder_time);

    const result = await sendBookingToBackend(bookingData);

    if (result.success) {
      setSuccessMessage("🎉 successfully !");
      const bookingId = result.data.data.ID;

      const bookingStatusData = {
        booking_id: bookingId,
        status_booking: isFutureBooking ? "Pending" : "Active",
      };

      try {
        const bookingStatusResult = await sendBookingStatusToBackend(bookingStatusData);

        if (bookingStatusResult.success) {
          setTimeout(() => {
            navigate(`/paid/${bookingId}`);
          }, 2000);
        } else {
          console.error("Failed to save booking status:", bookingStatusResult.message);
        }
      } catch (error) {
        console.error("Error saving booking status:", error);
      }
    } else {
      setSuccessMessage(`เกิดข้อผิดพลาด: ${result.message}`);
    }
  };

  if (!isLoaded) return <div>กำลังโหลดแผนที่...</div>;

  return (
    <div className="MapRoute">
  <GoogleMap
    mapContainerStyle={{ width: "100%", height: "400px" }}
    zoom={12}
    center={pickupLocation || { lat: 13.736717, lng: 100.523186 }}
  >
    {directions && <DirectionsRenderer directions={directions} />}
    {pickupLocation && <Marker position={pickupLocation} label="Pickup" />}
    {destinationLocation && <Marker position={destinationLocation} label="Destination" />}
  </GoogleMap>

  {successMessage && <div className="success-message">{successMessage}</div>}

  {/* ticket-container */}
  <div className="ticket-container">
    {vehicles.map((vehicle: Vehicle, index: number) => {
      const fareForVehicle =
        distance !== null &&
        !isNaN(vehicle.BaseFare) &&
        !isNaN(vehicle.PerKm) &&
        typeof vehicle.BaseFare === "number" &&
        typeof vehicle.PerKm === "number"
          ? vehicle.BaseFare + vehicle.PerKm * distance
          : null;

      return (
        <div key={vehicle.ID} className={`ticket ${selectedVehicle === vehicle.ID ? "selected" : ""}`}>
          <div className="dashed-border">
            <div
              className={`vehicle-item ${index % 2 === 0 ? "even" : "odd"}`}
              onClick={() => handleSelectVehicle(vehicle.ID)}
            >
              <div className="vehicle-icon">{vehicle.icon}</div>
              <div className="vehicle-info">
                <h3>{vehicle.NameCar}</h3>
                <p>
                  <UserOutlined
                    style={{
                      marginRight: "5px",
                      marginLeft: "5px",
                      fontSize: "30px",
                      verticalAlign: "middle",
                    }}
                  />
                  x{vehicle.Capacity}
                </p>
                {distance !== null && <p>Distance: {distance.toFixed(2)} Km</p>}
                {fareForVehicle !== null ? (
                  <p>Fare: {fareForVehicle.toFixed(2)} Baht</p>
                ) : (
                  <p>Fare: N/A</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>

  {/* booking-button-container */}
  <div className="booking-button-container">
    <button
      className="booking-button"
      onClick={handleBooking}
      disabled={!selectedVehicle || distance === null}
    >
      Booking Cabana
    </button>
  </div>
</div>

  );
}  
export default MapRoute;
