import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import "./Home.css";
import { fetchBooking } from "../services/api";
import {
  BookingInterface,
  PromotionResponseInterface,
} from "../interfaces/PaidInterface";
import { apiRequest } from "../../../config/ApiService";
import { Endpoint } from "../../../config/Endpoint";
const HomePayment: React.FC = () => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [bookingNew, setBookingNew] = useState<BookingInterface | null>(null);
  const [isLoadBooking, setisLoadBooking] = useState(true);
  const [promotionCode, setPromotionCode] = useState("");
  const [promotionId, setPromotionId] = useState<number | null>();
  const [discount, setDiscount] = useState("No discount applied");
  const [summery, setSummery] = useState(0.0);
  const [discountType, setDiscountType] = useState("");
  const [deliveryCost, setDeliveryCost] = useState("FREE");

  const { id } = useParams<{ id: string }>();
  if (!id) {
    alert("No booking ID found in URL");
    return;
  }

  function formatPrice(value: number): string {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const loadBooking = async () => {
    try {
      const bookingId = parseInt(id, 10);
      const data = await fetchBooking(bookingId);

      setBookingNew(data);
      if (data.distance > 5) {
        let sumDeliveryCost: number = (data.distance - 5) * 10;
        setDeliveryCost(`${sumDeliveryCost.toFixed(2)}`);
        setSummery((data.distance - 5) * 10 + data.total_price);
      } else {
        setSummery(data.total_price);
      }
    } catch (error) {
      console.error("Failed to fetch booking:", error);
    } finally {
      setisLoadBooking(false);
    }
  };

  useEffect(() => {
    loadBooking();
  }, []);

  const handleCheckPomotion = async () => {
    if (!promotionCode.trim() || promotionCode === "None") {
      alert("No valid promotion code applied.");
      return;
    }

    setDiscountType("");

    try {
      const response = await apiRequest<PromotionResponseInterface>(
        "GET",
        `${Endpoint.PAYMENT_PROMOTION_CHECK}?code=${promotionCode}&distance=${
          bookingNew?.distance
        }&price=${(bookingNew!.distance - 5) * 10}`
      );

      if (response.can_use) {
        let d = `${formatPrice(response.details.discount)}`;
        let sum = 0;
        if (bookingNew != null) {
          sum =
            bookingNew.distance > 5
              ? (bookingNew.distance - 5) * 10 -
                response.discount_value +
                bookingNew.total_price
              : bookingNew.total_price;
        }
        setPromotionId(response.promotion_id);
        setSummery(sum);
        setDiscount(d);
        setDiscountType(response.discount_type);
        let deliCost: string = "";
        if (
          formatPrice(
            (bookingNew!.distance - 5) * 10 - response.discount_value
          ) == "0.00"
        ) {
          deliCost = "FREE";
        } else {
          deliCost = formatPrice(
            (bookingNew!.distance - 5) * 10 - response.discount_value
          );
        }

        setDeliveryCost(deliCost);
      } else {
        alert(response.message);
        if (bookingNew != null) {
          bookingNew.distance > 5
            ? setSummery(
                bookingNew.total_price + (bookingNew.distance - 5) * 10
              )
            : setSummery(bookingNew.total_price);
        }
        setPromotionCode("");
        setDiscount("No discount applied");
      }
    } catch (error) {
      console.error("Error checking promotion code:", error);
      alert("No such promotional code found.");
      if (bookingNew != null) {
        bookingNew.distance > 5
          ? setSummery(bookingNew.total_price + (bookingNew.distance - 5) * 10)
          : setSummery(bookingNew.total_price);
      }
      setPromotionCode("");
      setDiscount("No discount applied");
    } finally {
      setIsEditMode(false);
    }
  };

  const handleProceed = () => {
    navigate("/payment", {
      state: {
        paymenyAmount: summery,
        promotionId: promotionId,
        bookingId: bookingNew?.id,
      },
    });
  };

  const handleMapClick = () => {
    window.open("https://www.google.com/maps", "_blank"); // Replace with actual map URL
  };

  const handleCancel = () => {
    alert("Cancel Payment"); // Show the alert
    navigate("/home");
  };
  const handleEdit = () => {
    setIsEditMode(true);
  };

  return (
    <div className="aa">
      <div className="payment-page">
        <div className="main-content">
          <div className="headerx">
            <h1>PAYMENT</h1>
            <div className="progress-indicator">
              <div className="circle filled"></div>
              <div className="circle"></div>
              <div className="circle"></div>
            </div>
          </div>
          <div className="content-wrapper">
            <div className="information-container">
              <h2>INFORMATION</h2>
              <div className="information-details">
                <div className="row">
                  <span className="label-with-icon">
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/854/854904.png"
                      alt="Starting Point Icon"
                      className="info-icon"
                    />
                    Starting Point:
                  </span>
                  <span>
                    {isLoadBooking
                      ? "Loading..."
                      : bookingNew == null
                      ? "None"
                      : bookingNew?.beginning ?? ""}
                  </span>
                </div>
                <div className="row">
                  <span className="label-with-icon">
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/1257/1257385.png"
                      alt="Destination Icon"
                      className="info-icon"
                    />
                    Destination:
                  </span>
                  <span>
                    {isLoadBooking
                      ? "Loading..."
                      : bookingNew == null
                      ? "None"
                      : bookingNew?.terminus ?? ""}
                  </span>
                </div>
                <div className="row">
                  <span className="label-with-icon">
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/5488/5488668.png"
                      alt="Vehicle Type Icon"
                      className="info-icon"
                    />
                    Vehicle Type:
                  </span>
                  <span>
                    {isLoadBooking
                      ? "Loading..."
                      : bookingNew == null
                      ? "None"
                      : bookingNew?.vehicle ?? ""}
                  </span>
                </div>
                <div className="row">
                  <span className="label-with-icon">
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/2382/2382625.png"
                      alt="Estimated Cost Icon"
                      className="info-icon"
                    />
                    Estimated Cost:
                  </span>
                  <span>
                    {isLoadBooking
                      ? "Loading..."
                      : formatPrice(bookingNew?.total_price ?? 0)}{" "}
                    Baht
                  </span>
                </div>
                <div className="row">
                  <span className="promotion-label">
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/6632/6632881.png"
                      alt="Promo Code Icon"
                      className="promo-code-icon"
                    />
                    Promotion Code:
                  </span>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={promotionCode}
                      onChange={(e) => setPromotionCode(e.target.value)}
                      className="promo-input"
                    />
                  ) : (
                    <span className="promo-value">
                      {promotionCode || "None"}
                    </span>
                  )}
                </div>

                {/* Buttons moved to a separate container */}
                <div className="promotion-actions">
                  <button className="used-button" onClick={handleCheckPomotion}>
                    Used
                  </button>
                  <button className="edit-button" onClick={handleEdit}>
                    Edit
                  </button>
                </div>
                <div className="row">
                  <span className="label-with-icon">
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/9341/9341950.png"
                      alt=" Discount Icon"
                      className="info-icon"
                    />
                    <span className="vb">
                      Discount:
                      <span className="io">
                        {discount}{" "}
                        {discountType != ""
                          ? discountType == "percent"
                            ? "%"
                            : "Baht"
                          : ""}
                      </span>
                    </span>
                  </span>
                </div>
                <div className="row">
                  <span className="label-with-icon">
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/870/870181.png"
                      alt="Delivery Cost Icon"
                      className="info-icon"
                    />
                    <span>
                      Delivery Cost:
                      <span>
                        {deliveryCost} {deliveryCost != "FREE" ? "Baht" : ""}
                      </span>
                    </span>
                  </span>
                </div>
                <div className="row">
                  <span className="label-with-icon">
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/6712/6712918.png"
                      alt="Total Cost Icon"
                      className="info-icon"
                    />

                    <span>
                      Total Cost:
                      <span>{summery.toFixed(2)} Baht</span>
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div className="avatar-container">
              <div
                className="avatar-frame"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
              >
                <div className="blinking-light"></div> {/* Blinking Light */}
                <img
                  src={
                    hovered
                      ? "https://cdn-icons-png.flaticon.com/128/854/854878.png"
                      : "https://cdn-icons-png.flaticon.com/512/16802/16802273.png"
                  }
                  alt="User Avatar"
                  className="avatar-img"
                />
              </div>
              <p className="booking-text">
                Booking:{" "}
                {isLoadBooking
                  ? "No bookings available"
                  : bookingNew == null
                  ? "No bookings available"
                  : bookingNew?.id}
              </p>
              <p className="distance-text">
                Distance:{" "}
                {isLoadBooking
                  ? "Loading..."
                  : bookingNew == null
                  ? "None"
                  : bookingNew?.distance ?? ""}{" "}
                {bookingNew != null ? <span>KM</span> : ""}
              </p>
              <div className="tgx" onClick={handleMapClick}>
                <img
                  src="https://img.freepik.com/premium-vector/map-with-destination-location-point-city-map-with-street-river-gps-map-navigator-concept_34645-1078.jpg"
                  alt="Map Preview"
                  className="map-img"
                />
              </div>
              <p className="map-label">View Map</p>
            </div>
          </div>

          <div className="buttons">
            <button className="proceed-button" onClick={handleProceed}>
              Proceed to Payment
            </button>
            <button className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default HomePayment;
