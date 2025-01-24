import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignIn } from "../../services/https/Authen/authen";
import "./Login.css";
import { message } from "antd";
import logo from "../../assets/logo1.png";
import background from "../../assets/bg3.png";
import { SignInInterface } from "../../interfaces/Signln";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  // State management for form inputs
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const values: SignInInterface = { email, password };
      const res = await SignIn(values);

      if (res.status === 200) {
        messageApi.success(`Welcome back, ${res.data.role}!`);

        // Save login data to localStorage
        localStorage.setItem("isLogin", "true");
        localStorage.setItem("token_type", res.data.token_type || "");
        localStorage.setItem("token", res.data.token || "");
        localStorage.setItem("id", res.data.id || "");
        localStorage.setItem("role", res.data.role || "");

        console.log("JWT Token:", res.data);
        console.log("User Role:", res.data.role);

        // Redirect based on role
        switch (res.data.role) {
          case "Admin":
          case "Employee":
            navigate("/dashboard");
            break;
          case "Driver":
            navigate("/dashboards");
            break;
          case "Passenger":
            navigate("/home");
            break;
          default:
            messageApi.error("Unauthorized role");
        }
      } else {
        messageApi.error("Login failed. Please check your email or password.");
        console.error("API Response Error:", res);
        setErrorMessage("Login failed. Please check your email or password.");
      }
    } catch (error) {
      messageApi.error("An error occurred while signing in");
      console.error("Error during sign-in:", error);
      setErrorMessage("Login failed. Please check your email or password.");
    }
  };

  return (
    <div
      className="login-container"
      style={{
        background: `url(${background}) no-repeat center center`,
        backgroundSize: "cover",
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        position: "relative",
      }}
    >
      {contextHolder}
      <div
        className="login-form"
        style={{
          position: "absolute",
          left: "75%",
          transform: "translateX(-50%)",
          color: "#fff", // ตัวอักษรทั้งหมดเป็นสีขาว
        }}
      >
        <div className="login">
          <img src={logo} alt="Logo" className="logo" />
          <h2 style={{ color: "#fff" }}>Login</h2>
          {errorMessage && (
            <div
              className="error-message"
              style={{
                color: "#ff4d4f", // สีข้อความข้อผิดพลาด
                marginBottom: "10px",
              }}
            >
              {errorMessage}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email" style={{ color: "#fff" }}>
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="password" style={{ color: "#fff" }}>
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" className="login-btn">
              Login
            </button>

            <div
              style={{
                marginTop: "10px",
                textAlign: "center",
                color: "#fff",
              }}
            >
              <span>Don't have an account yet?</span>
              <br /> {/* เพิ่มบรรทัดนี้เพื่อให้ "Sign Up" ขึ้นบรรทัดใหม่ */}
              <a
                style={{
                  color: "#61b0ff",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
