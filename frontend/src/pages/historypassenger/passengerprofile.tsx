import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Avatar, Button, Typography, message } from "antd";
import { UserOutlined } from "@ant-design/icons";

import { fetchUserData } from "../../services/https/Passenger/passenger";
import "./PassengerProfile.css"; // Import CSS

const { Title, Text } = Typography;

const PassengerProfile: React.FC = () => {
  const [passengerData, setPassengerData] = useState<any>(null); // เก็บข้อมูลผู้โดยสาร
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("id");
    const userRole = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    console.log("JWT Token:", token);
    console.log("User Role:", userRole);
    console.log("id passenger:", userId);

    if (!userId || !userRole || !token) {
      message.error("Unauthorized access.");
      navigate("/home");
      return;
    }

    if (userRole.toLowerCase() !== "passenger") {
      message.error("Access restricted to passengers only.");
      navigate("/home");
      return;
    }

    fetchUserData(userId, userRole, setPassengerData).catch((err) => {
      console.error("Error fetching user data:", err);
      message.error("Failed to load profile. Please try again.");
    });
  }, [navigate]);

  console.log("Passenger Data:", passengerData);

  // ตรวจสอบข้อมูลที่ได้จาก API
  if (!passengerData) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="profile-container">
      <Card className="profile-card">
        <Avatar
          size={100}
          icon={<UserOutlined />}
          className="profile-avatar"
        />
        <Title level={3}>
          {passengerData.first_name} {passengerData.last_name}
        </Title>
        <Text type="secondary" className="profile-email">
          Email: {passengerData.email || "Not available"}
        </Text>
        <Text className="profile-phone">
          Phone: {passengerData.phone || "Not available"}
        </Text>
        <Button
          type="primary"
          className="profile-button"
          onClick={() => navigate("/Editprofile")}
        >
          Edit Profile
        </Button>
        <Button type="default" onClick={() => navigate("/home")}>
          Back to Home
        </Button>
        <Button
          type="primary"
          className="profile-button"
          onClick={() => navigate("/")}
        >
          Log out
        </Button>
      </Card>
    </div>
  );
};

export default PassengerProfile;
