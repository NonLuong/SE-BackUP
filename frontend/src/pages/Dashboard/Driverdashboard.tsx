import React from "react";
import AdminSidebar from "../../components/sider/DriverSidebar"; // ปรับ path ให้ถูกต้อง
import d2 from "../../assets/d2.jpg"; // ปรับ path ให้ตรงกับที่เก็บรูป

const Dashboard: React.FC = () => {
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <AdminSidebar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#EDE8FE",
          overflow: "auto",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          แปะๆ เดะมาทำให้จู้
        </h1>
        <img
          src={d2}
          alt="Dashboard Image"
          style={{
            maxWidth: "700px",
            borderRadius: "10px",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
