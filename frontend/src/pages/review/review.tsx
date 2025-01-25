import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Review.css";
import { Endpoint } from "../../config/Endpoint";
import { apiRequest } from "../../config/ApiService";
import { BookingInterface } from "../payment/interfaces/PaidInterface";
import { fetchBooking } from "../payment/services/api";
import CircularProgress from "@mui/material/CircularProgress/CircularProgress";

const Review: React.FC = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState<string>("");
  const [feedbackOptions, setFeedbackOptions] = useState<string[]>([]);
  const [booking, setBooking] = useState<BookingInterface | null>(null);
  const [isLoadBooking, setisLoadBooking] = useState(true);

  const location = useLocation();
  const { bookingId } = location.state || {};

  useEffect(() => {
    const loadBookingById = async () => {
      try {
        const bId = parseInt(bookingId, 10);
        const data = await fetchBooking(bId);

        setBooking(data);
      } catch (error) {
        console.error("Failed to fetch booking:", error);
        alert(`Failed to fetch booking : ${error}`);

        navigate("/home");
      } finally {
        setisLoadBooking(false);
      }
    };

    loadBookingById();
  }, [bookingId]);

  const toggleFeedbackOption = (option: string) => {
    setFeedbackOptions((prevOptions) =>
      prevOptions.includes(option)
        ? prevOptions.filter((o) => o !== option)
        : [...prevOptions, option]
    );
  };

  const handleReviewLater = () => {
    alert("You can review later!");
    navigate("/home");
  };

  const handleSubmit = async () => {
    const offensiveWords = {
      shit: "s*",
      damn: "d*",
      hell: "h*",
      stupid: "s*",
      fuck: "f*",
      asshole: "a*",
      bastard: "b*",
      jerk: "j*",
      crap: "c*",
      bitch: "b*",
      ควาย: "ค*",
      บ้า: "บ*",
      แม่ง: "แ*",
      กาก: "ก*",
      เลว: "ล*",
      สันดาน: "ส*",
      ไอ้เวร: "ไ*",
      โง่: "โ*",
      ถ่อย: "ถ*",
      ชั่ว: "ช*",
      ไอ้: "อ*",
    };

    let containsOffensiveWord = false;

    Object.keys(offensiveWords).forEach((word) => {
      const regex = new RegExp(word, "gi");
      if (regex.test(reviewText)) {
        containsOffensiveWord = true; // ถ้าพบคำไม่สุภาพ เปลี่ยนสถานะเป็น true
      }
    });

    if (containsOffensiveWord) {
      alert("คำไม่สุภาพไม่สามารถแสดงข้อมูลได้");
      return;
    }

    if (!reviewText.trim()) {
      alert("Please write a comment before submitting your review.");
      return;
    }

    if (feedbackOptions.length === 0) {
      alert("Please select at least one feedback option.");
      return;
    }

    try {
      const reviewData = {
        rating: rating,
        comment: reviewText.trim(),
        booking_id: bookingId,
        passenger_id: booking?.passenger_id,
        driver_id: booking?.driver_id,
        feedback: feedbackOptions.length > 0 ? feedbackOptions.join(", ") : "",
      };

      const response = await apiRequest("POST", Endpoint.REVIEW, reviewData);

      const notifyReview = {
        id: `${booking?.driver_id}`,
        message: "update",
      };

      apiRequest("POST", Endpoint.REVIEW_NOTIFY, notifyReview);

      if (response) {
        alert("Review Submitted Successfully!");

        navigate("/review/history");
      }
    } catch (error) {
      console.error("Error during fetch:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  function GradientCircularProgress() {
    return (
      <React.Fragment>
        <svg width={0} height={0}>
          <defs>
            <linearGradient id="my_gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e01cd5" />
              <stop offset="100%" stopColor="#1CB5E0" />
            </linearGradient>
          </defs>
        </svg>
        <CircularProgress
          size={60} // ขยายขนาด
          thickness={6} // ปรับความหนา
          sx={{
            "svg circle": {
              stroke: "url(#my_gradient)", // เพิ่ม gradient
            },
          }}
          style={{ marginBottom: "40px" }}
        />
      </React.Fragment>
    );
  }

  return (
    <div className="ss">
      {isLoadBooking ? (
        <GradientCircularProgress />
      ) : (
        <div className="review-container">
          <header className="review-header">
            <h1>REVIEW</h1>
            <div className="qwr">
              <div className="qw"></div>
              <div className="qw"></div>
              <div className="qw"></div>
              <div className="qw"></div>
            </div>
          </header>

          <div className="review-content">
            <div className="rating-section">
              <div className="review-card driver-card">
                <div className="driver-card">
                  <div className="driver-image-frame">
                    <img
                      className="driver-image"
                      src="https://cdn-icons-png.flaticon.com/128/2684/2684218.png"
                      alt="Driver Avatar"
                    />
                  </div>

                  <p className="driver-id">Driver_ID: {booking?.driver_id}</p>
                </div>

                <div className="rating-buttons">
                  <button
                    className={`reaction-button like ${
                      feedbackOptions.includes("like") ? "active" : ""
                    }`}
                    onClick={() => toggleFeedbackOption("like")}
                  >
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/456/456115.png"
                      alt="Like"
                      className="reaction-icon"
                    />
                    Like
                  </button>
                  <button
                    className={`reaction-button dislike ${
                      feedbackOptions.includes("dislike") ? "active" : ""
                    }`}
                    onClick={() => toggleFeedbackOption("dislike")}
                  >
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/9849/9849304.png"
                      alt="Dislike"
                      className="reaction-icon"
                    />
                    Dislike
                  </button>
                  <button
                    className={`reaction-button love ${
                      feedbackOptions.includes("love") ? "active" : ""
                    }`}
                    onClick={() => toggleFeedbackOption("love")}
                  >
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/2107/2107845.png"
                      alt="Love"
                      className="reaction-icon"
                    />
                    Love
                  </button>
                </div>
                <p className="rating-label">Rating</p>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${
                        rating && rating >= star ? "selected" : ""
                      }`}
                      onClick={() => setRating(star)} // Set the clicked star as the rating
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <textarea
                className="comment-box"
                placeholder="                 ----Comment Here----"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                style={{ color: "#000000" }}
              ></textarea>
            </div>

            <div className="review-card feedback-card">
              <h3>Optional Feedback</h3>
              <div className="feedback-options">
                {[
                  {
                    id: "comfortable",
                    label: "Comfortable",
                    icon: "https://cdn-icons-png.flaticon.com/128/1703/1703123.png",
                  },
                  {
                    id: "safety",
                    label: "Safety",
                    icon: "https://cdn-icons-png.flaticon.com/128/1161/1161388.png",
                  },
                  {
                    id: "communication",
                    label: "Communication",
                    icon: "https://cdn-icons-png.flaticon.com/128/610/610413.png",
                  },
                  {
                    id: "cleanliness",
                    label: "Cleanliness",
                    icon: "https://cdn-icons-png.flaticon.com/128/2059/2059802.png",
                  },
                ].map((option) => (
                  <button
                    key={option.id}
                    className={`feedback-button ${
                      feedbackOptions.includes(option.id) ? "active" : ""
                    }`}
                    onClick={() => toggleFeedbackOption(option.id)}
                  >
                    <img
                      src={option.icon}
                      alt={option.label}
                      className="feedback-icon"
                    />
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="contact-info-container">
                <div className="contact-message">
                  <img
                    src="https://cdn-icons-png.flaticon.com/128/2058/2058197.png"
                    alt="Contact Icon"
                    className="contact-icon"
                  />
                  <p>
                    If the driver was rude or if you need further assistance,
                    please do not hesitate to contact us.:
                  </p>
                </div>

                <div className="contact-info-item">
                  <img
                    src="https://cdn-icons-png.flaticon.com/128/15047/15047587.png"
                    alt="Email Icon"
                    className="contact-icon"
                  />
                  <p>
                    Email:{" "}
                    <a href="mailto:Cabana@email.com">Cabana@email.com</a>
                  </p>
                </div>
                <div className="contact-info-item">
                  <img
                    src="https://cdn-icons-png.flaticon.com/128/724/724664.png"
                    alt="Phone Icon"
                    className="contact-icon"
                  />
                  <p>Tel: 098-456-3211</p>
                </div>
              </div>
            </div>

            <div className="review-card passenger-card">
              <div className="passenger-image-frame">
                <img
                  className="passenger-image"
                  src="https://cdn-icons-png.flaticon.com/128/1611/1611733.png"
                  alt="Passenger Avatar"
                />
              </div>
              <div className="passenger-details">
                <p className="passenger-title">Review BY</p>
                <p className="passenger-id">
                  Passenger_ID: {booking?.passenger_id}
                </p>
              </div>
            </div>
          </div>

          <div className="button-container">
            <button className="primary-btn" onClick={handleSubmit}>
              Submit Review
            </button>
            <button className="review-later-btn" onClick={handleReviewLater}>
              Review Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default Review;
