import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Input, Select, message, Row, Col } from "antd";
import "./SignUP.css"; // ใช้ไฟล์ CSS เดียวกับหน้า Login
import logo from "../../assets/logo1.png"; // โลโก้
import background from "../../assets/signup.jpg"; // Background
import { GetGender } from "../../services/https/GenderAPI";
import { CreateUser } from "../../services/https/Authen/signup";
import { Passenger } from "../../interfaces/IPassenger";
import { Gender } from "../../interfaces/IGender";

const SignUpPages: React.FC = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [genders, setGenders] = useState<Gender[]>([]);

  // Fetch genders from the API
  const fetchGender = async () => {
    const res = await GetGender();
    if (res.status === 200) {
      setGenders(res.data);
    } else {
      messageApi.error("Unable to fetch gender data");
    }
  };

  // Handle form submission
  const onFinish = async (values: Passenger) => {
    const payload = { ...values, role_id: 1 }; // Set role_id to 1
    try {
      const res = await CreateUser(payload);

      if (res.status === 201) {
        messageApi.success("Registration successful!");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        messageApi.error(res.data.error || "Registration failed");
      }
    } catch (error) {
      messageApi.error("An error occurred during registration");
    }
  };

  useEffect(() => {
    fetchGender();
  }, []);

  return (
    <div
      className="login-container"
      style={{
        background: `url(${background}) no-repeat center center`,
        backgroundSize: "cover",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {contextHolder}
      <div
        className="login-form"
        style={{
          background: "rgba(255, 255, 255, 0.3)",
          padding: "40px",
          borderRadius: "10px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          width: "900px", // Increase form width
          maxWidth: "90%",
          color: "#fff", // Set text color to white
        }}
      >
        <img
          src={logo}
          alt="Logo"
          style={{ display: "block", margin: "0 auto 20px", width: "120px" }}
        />
        <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#fff" }}>
          Sign Up
        </h2>
        <Form layout="vertical" onFinish={onFinish}>
          <Row gutter={[24, 16]}>
            {/* User Name */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span style={{ color: "#fff" }}>Username</span>}
                name="user_name"
                rules={[{ required: true, message: "Please enter your username!" }]}
              >
                <Input placeholder="Enter your username" />
              </Form.Item>
            </Col>

            {/* Email */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span style={{ color: "#fff" }}>Email</span>}
                name="email"
                rules={[
                  { type: "email", message: "Invalid email format!" },
                  { required: true, message: "Please enter your email!" },
                ]}
              >
                <Input placeholder="Enter your email" />
              </Form.Item>
            </Col>

            {/* First Name */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span style={{ color: "#fff" }}>First Name</span>}
                name="first_name"
                rules={[{ required: true, message: "Please enter your first name!" }]}
              >
                <Input placeholder="Enter your first name" />
              </Form.Item>
            </Col>

            {/* Last Name */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span style={{ color: "#fff" }}>Last Name</span>}
                name="last_name"
                rules={[{ required: true, message: "Please enter your last name!" }]}
              >
                <Input placeholder="Enter your last name" />
              </Form.Item>
            </Col>

            {/* Phone Number */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span style={{ color: "#fff" }}>Phone Number</span>}
                name="phone_number"
                rules={[
                  { required: true, message: "Please enter your phone number!" },
                  { len: 10, message: "Phone number must be 10 digits!" },
                ]}
              >
                <Input placeholder="Enter your phone number" />
              </Form.Item>
            </Col>

            {/* Password */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span style={{ color: "#fff" }}>Password</span>}
                name="password"
                rules={[{ required: true, message: "Please enter your password!" }]}
              >
                <Input.Password placeholder="Enter your password" />
              </Form.Item>
            </Col>

            {/* Gender */}
            <Col xs={24} sm={5}>
              <Form.Item
                label={<span style={{ color: "#fff" }}>Gender</span>}
                name="gender_id"
                rules={[{ required: true, message: "Please select your gender!" }]}
              >
                <Select placeholder="Select gender">
                  {genders.map((g) => (
                    <Select.Option key={g.ID} value={g.ID}>
                      {g.gender}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
            Sign Up
          </Button>
          <div style={{ marginTop: "10px", textAlign: "center", color: "#fff" }}>
            Already have an account? <a style={{ color: "#61b0ff" }} onClick={() => navigate("/login")}>Login</a>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default SignUpPages;
