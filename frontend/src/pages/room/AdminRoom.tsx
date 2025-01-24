import { useState, useEffect } from "react";
import {
  Space,
  Table,
  Col,
  Row,
  Card,
  Statistic,
  message,
  Popconfirm,
  Layout,
} from "antd";
import { DeleteOutlined, TeamOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { GetRooms, DeleteRoomById } from "../../services/https/RoomAPI";
import { RoomInterface } from "../../interfaces/IRoom";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/sider/AdminSidebar"; // ✅ ใช้ Sidebar ของ Admin
import "./AdminRoom.css";

function Rooms() {
  const [rooms, setRooms] = useState<RoomInterface[]>([]);
  const [totalRooms, setTotalRooms] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const userRole = "admin";

  // ✅ ฟังก์ชันดึงข้อมูลห้อง
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await GetRooms();
      console.log("📡 API Response:", res.data); // Debug API Response

      if (res && res.status === 200 && Array.isArray(res.data)) {
        // Mapping ข้อมูลห้อง
        const mappedRooms = res.data.map((room: any) => ({
          ID: room.ID,
          RoomName: room.room_name,
          Title: room.title,
          Capacity: room.capacity,
          CurrentBookings: room.current_bookings || 0,
          Trainer: room.trainer
            ? {
                FirstName: room.trainer.first_name || "ไม่ระบุชื่อ",
                LastName: room.trainer.last_name || "ไม่ระบุนามสกุล",
              }
            : null,
          Status:
            room.current_bookings >= room.capacity
              ? "เต็ม"
              : room.current_bookings > 0
              ? "ว่างบางส่วน"
              : "ว่าง",
        }));
        setRooms(mappedRooms);
        setTotalRooms(mappedRooms.length);
      } else {
        console.error("Unexpected API response:", res);
        messageApi.error(res?.error || "ไม่สามารถดึงข้อมูลได้");
        setRooms([]);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      messageApi.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  // ✅ ฟังก์ชันลบห้อง
  const handleDelete = async (id: number) => {
    try {
      const res = await DeleteRoomById(id);
      if (res && res.status === 200) {
        messageApi.success("ลบห้องสำเร็จ");
        fetchRooms();
      } else {
        messageApi.error(res?.error || "ไม่สามารถลบห้องได้");
      }
    } catch (error) {
      messageApi.error("เกิดข้อผิดพลาดในการลบห้อง");
      console.error("Error deleting room:", error);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // ✅ กำหนด Columns ของ Table
  const columns: ColumnsType<RoomInterface> = [
    {
      title: "ชื่อห้อง",
      dataIndex: "RoomName",
      key: "RoomName",
    },
    {
      title: "หัวข้อ",
      dataIndex: "Title",
      key: "Title",
    },
    {
      title: "ความจุ",
      key: "Capacity",
      render: (record: RoomInterface) =>
        `${record.CurrentBookings || 0}/${record.Capacity || 0}`,
    },
    {
      title: "เทรนเนอร์",
      key: "Trainer",
      render: (record: RoomInterface) =>
        record.Trainer
          ? `${record.Trainer.FirstName} ${record.Trainer.LastName}`
          : "ไม่ระบุเทรนเนอร์",
    },
    {
      title: "สถานะ",
      dataIndex: "Status",
      key: "Status",
    },
    {
      title: "การกระทำ",
      key: "actions",
      width: 150,
      //onClick={() => navigate(`/rooms/edit/${record.ID}`)}
      render: (record: RoomInterface) => (
        <Space>
          {userRole === "admin" && (
            <>
              <button
                className="AdminRoom-Btn"
                onClick={() => navigate(`/rooms/edit/${record.ID}`)}
              >
                Edit
                <svg className="AdminRoom-svg" viewBox="0 0 512 512">
                  <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
                </svg>
              </button>
              <Popconfirm
                title={
                  <div className="AdminRoom-popconfirm">
                    <h3 className="AdminRoom-popconfirm-title">
                      <DeleteOutlined
                        style={{ fontSize: "20px", color: "#f5222d" }}
                      />
                      <br />
                      ยืนยันการลบห้อง?
                    </h3>
                    <p className="AdminRoom-popconfirm-message">
                      การลบห้องนี้ไม่สามารถกู้คืนได้ คุณแน่ใจหรือไม่?
                    </p>
                  </div>
                }
                onConfirm={() =>
                  record.ID !== undefined && handleDelete(record.ID)
                }
                okText="ใช่"
                cancelText="ไม่"
                okButtonProps={{
                  danger: true,
                  className: "AdminRoom-popconfirm-ok",
                }}
                cancelButtonProps={{
                  className: "AdminRoom-popconfirm-cancel",
                }}
              >
                <button className="AdminRoom-Btn">
                  Delete
                  <svg className="AdminRoom-svg" viewBox="0 0 448 512">
                    <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path>
                  </svg>
                </button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminSidebar /> {/* ✅ ใช้ Sidebar */}
      <Layout style={{ padding: "20px", backgroundColor: "#EDE8FE" }}>
        {contextHolder}
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
          ระบบจัดการห้องอบรม
        </h1>

        {/* Summary Section */}
        <Row gutter={[32, 32]} style={{ marginBottom: "30px" }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              bordered={false}
              style={{
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                padding: "16px",
              }}
            >
              <Statistic
                title="จำนวนห้องอบรม (ทั้งหมด)"
                value={totalRooms}
                prefix={<TeamOutlined />}
                valueStyle={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  textAlign: "center",
                  marginTop: "10px",
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Room Table */}
        <Table
          rowKey="ID"
          columns={columns}
          dataSource={rooms}
          loading={loading}
          className="AdminRoom-table"
          bordered
          size="middle"
          pagination={{ pageSize: 5 }}
          scroll={{ x: 800 }}
          style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        />

        {/* Add Room Button */}
        <div style={{ textAlign: "right", marginTop: "20px" }}>
          <button
            onClick={() => navigate("/rooms/create")}
            style={{
              border: "2px solid #24b4fb",
              backgroundColor: "#24b4fb",
              borderRadius: "0.5em",
              cursor: "pointer",
              padding: "0.4em 0.8em",
              transition: "all ease-in-out 0.2s",
              fontSize: "16px",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#0071e2")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#24b4fb")
            }
          >
            <span
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              <svg
                height="24"
                width="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                style={{ marginRight: "3px" }}
              >
                <path d="M0 0h24v24H0z" fill="none"></path>
                <path
                  d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"
                  fill="currentColor"
                ></path>
              </svg>
              Create
            </span>
          </button>
        </div>
      </Layout>
    </Layout>
  );
}

export default Rooms;
