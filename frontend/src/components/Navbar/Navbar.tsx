import React from "react";
import { Link } from "react-router-dom";
import { UserOutlined } from "@ant-design/icons"; // นำเข้าไอคอนจาก Ant Design
import "./Navbar.css";

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
       <div className="logo">
        <Link to="/">
          <img 
            src="logo2.jpeg" 
            alt="Cabana Logo" 
            className="logo-image" 
        
            style={{
              width: "60px", // ความกว้างของวงกลม
              height: "60px", // ความสูงของวงกลม (เท่ากับความกว้าง)
              borderRadius: "50%", // กำหนดเป็นวงกลม
              objectFit: "cover", // ทำให้ภาพเต็มพื้นที่
              padding: "5px",
              marginLeft: "10px",
             
              
            }} 
            
          />
         
        </Link>
      </div>
      <ul className="nav-links">
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/RideHistory">Rides</Link>
        </li>
        <li>
          <Link to="/Promotion">Promotion</Link>
        </li>
        <li>
          <Link to="/PassengerChat">ChatPassenger</Link>
        </li>
        <li>
          <Link to="/DriverChat">ChatDriver</Link>
        </li>
        <li>
          <Link to="/DriverBooking">Dirverbooking</Link>
        </li>
        
        <li>
         
            <div
              className="profile-icon-wrapper"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "#464468", // พื้นหลังสีฟ้า
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <UserOutlined
                style={{
                  fontSize: "20px",
                  color: "#fff", // สีของไอคอน
                }}
              />
            </div>
         
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
