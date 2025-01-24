import { useState, useEffect } from "react";
import { Table, Card, Layout, Statistic, message } from "antd";
import { TeamOutlined } from "@ant-design/icons";
import { GetRooms } from "../../services/https/RoomAPI";
import { CreateTrainbook } from "../../services/https/TrainBookAPI";
import { RoomInterface } from "../../interfaces/IRoom";
import { TrainbookInterface } from "../../interfaces/ITrainbook";
import DriverSidebar from "../../components/sider/DriverSidebar";
import { useNavigate } from "react-router-dom";
import "./DriverRoom.css";

function DriverRooms() {
  const [rooms, setRooms] = useState<RoomInterface[]>([]);
  const [selectedRoomID, setSelectedRoomID] = useState<number | null>(null);
  const [totalRooms, setTotalRooms] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [messageApi, contextHolder] = message.useMessage();
  const [, setBookingLoading] = useState<boolean>(false);
  const [, setAnimationClass] = useState<string>("");
  const navigate = useNavigate();
  const driverID = localStorage.getItem("id")
    ? Number(localStorage.getItem("id"))
    : null;
  const token = localStorage.getItem("token");

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await GetRooms();
      console.log("📡 API Response:", res.data);

      if (res && res.status === 200 && Array.isArray(res.data)) {
        const mappedRooms: RoomInterface[] = res.data.map((room: any) => ({
          ID: room.ID ?? 0,
          RoomName: room.room_name,
          Title: room.title,
          Capacity: room.capacity ?? 0,
          CurrentBookings: room.current_bookings ?? 0,
          Trainer: room.trainer
            ? {
                FirstName: room.trainer.first_name || "ไม่ระบุชื่อ",
                LastName: room.trainer.last_name || "ไม่ระบุนามสกุล",
              }
            : null,
          Detail: room.detail || "ไม่มีรายละเอียด",
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
        messageApi.error(res?.error || "ไม่สามารถดึงข้อมูลได้");
        setRooms([]);
      }
    } catch (error) {
      messageApi.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (roomId: number) => {
    if (!driverID || !token) {
      message.error("⚠️ กรุณาเข้าสู่ระบบใหม่");
      return;
    }
    setBookingLoading(true);
    try {
      const trainbook: TrainbookInterface = {
        RoomID: roomId,
        DriverID: driverID,
        Status: "Confirmed",
      };
      const res = await CreateTrainbook(roomId, trainbook, token);
      if (res && res.message === "สร้างการจองสำเร็จ") {
        message.success("ยืนยันการจองสำเร็จ!");
        fetchRooms();
        setTimeout(() => navigate("/training"), 1500);
      } else {
        message.error("คุณได้จองห้องนี้ไปแล้ว");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดขณะจอง");
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const toggleExpandRoom = (roomID: number) => {
    setSelectedRoomID(selectedRoomID === roomID ? null : roomID);

    // ทำให้แน่ใจว่า Animation ทำงานหลังจาก Component Render
    setTimeout(() => {
      setAnimationClass("DriverRoom-slide-enter");
    }, 10);
  };

  const getStatusColor = (current: number, capacity: number) => {
    if (current === 0) return "🟢"; // ว่าง
    if (current < capacity) return "🟡"; // ว่างบางส่วน
    return "🔴"; // เต็ม
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <DriverSidebar />
      <Layout className="DriverRoom-layout-container">
        {contextHolder}
        <h1 className="DriverRoom-header-title">
          ระบบการจองห้องอบรมสำหรับคนขับ
        </h1>
        <Card
          className="DriverRoom-statistic-card"
          style={{
            width: "150px", // ลดความกว้าง
            padding: "10px", // ลด padding
            textAlign: "center", // จัดให้อยู่ตรงกลาง
            boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.1)", // เงาเล็กลง
            borderRadius: "8px", // มุมโค้ง
          }}
        >
          <div
            style={{ fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}
          >
            Room(Totle)
          </div>
          <Statistic
            value={totalRooms}
            prefix={<TeamOutlined />}
            valueStyle={{
              fontSize: "20px", // ขนาดตัวเลข
              fontWeight: "bold",
            }}
          />
        </Card>

        <Table
          className="DriverRoom-table"
          dataSource={rooms}
          rowKey="ID"
          pagination={{ pageSize: 5 }}
          loading={loading}
          bordered
          size="middle"
          scroll={{ x: 800 }}
          expandedRowKeys={selectedRoomID ? [selectedRoomID] : []}
          onRow={(record) => ({
            onClick: () => toggleExpandRoom(record.ID ?? 0),
          })}
          expandable={{
            expandedRowRender: (record) => (
              <div
                className={`DriverRoom-detail-card ${
                  selectedRoomID === record.ID ? "show" : ""
                }`}
                style={{
                  backgroundColor: "#f8f8f8",
                  borderRadius: "8px",
                  padding: "16px",
                  textAlign: "left", // ชิดซ้าย
                }}
              >
                <h2 className="DriverRoom-detail-title">รายละเอียดห้อง</h2>
                <p>
                  <strong>ชื่อห้อง:</strong> {record.RoomName}
                </p>
                <p>
                  <strong>หัวข้อ:</strong> {record.Title}
                </p>
                <p>
                  <strong>รายละเอียดการอบรม:</strong> {record.Detail}
                </p>
                <p>
                  <strong>ชื่อเทรนเนอร์:</strong>{" "}
                  {record.Trainer
                    ? `${record.Trainer.FirstName} ${record.Trainer.LastName}`
                    : "ไม่ระบุ"}
                </p>
                <p>
                  <strong>จำนวน:</strong> {record.CurrentBookings ?? 0}/
                  {record.Capacity ?? 0}
                </p>
                <div className="DriverRoom-button-group">
                  <button
                    className="DriverRoom-cancel-button"
                    onClick={() => setSelectedRoomID(null)}
                  >
                    ยกเลิก
                  </button>
                  <button
                    className="DriverRoom-confirm-button"
                    onClick={() => handleBooking(record.ID ?? 0)}
                  >
                    ยืนยัน
                  </button>
                </div>
              </div>
            ),
            showExpandColumn: false,
          }}
          columns={[
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
              render: (_, record) =>
                getStatusColor(
                  record.CurrentBookings ?? 0,
                  record.Capacity ?? 0
                ),
            },
          ]}
        />
      </Layout>
    </Layout>
  );
}

export default DriverRooms;
