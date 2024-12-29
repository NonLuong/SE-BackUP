import { useState, useEffect } from "react";
import {
  Space,
  Table,
  Button,
  Col,
  Row,
  Divider,
  message,
  Empty,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { GetRooms, DeleteRoomById } from "../../services/https/RoomAPI";
import { RoomInterface } from "../../interfaces/IRoom";
import { Link, useNavigate } from "react-router-dom";

function Rooms() {
  const [rooms, setRooms] = useState<RoomInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const userRole = "admin";

  // ฟังก์ชันดึงข้อมูลห้อง
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await GetRooms();
      console.log("API Response:", res); // ตรวจสอบข้อมูลที่ได้รับจาก API
      if (res && res.status === 200 && Array.isArray(res.data)) {
        const mappedRooms = res.data.map((room: any) => ({
          ID: room.ID,
          RoomName: room.room_name,
          Capacity: room.capacity,
          CurrentBookings: room.current_bookings || 0,
          Trainer: room.trainer
            ? {
                FirstName: room.trainer.first_name || "ไม่ระบุชื่อ",
                LastName: room.trainer.last_name || "ไม่ระบุนามสกุล",
              }
            : null,
          Status:
            (room.current_bookings || 0) >= (room.capacity || 0)
              ? "เต็ม"
              : room.current_bookings
              ? "ว่างบางส่วน"
              : "ว่าง",
        }));
        setRooms(mappedRooms);
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

  // ฟังก์ชันลบห้อง
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

  // ฟังก์ชันไปหน้าการจอง
  const handleBooking = (id: number) => {
    if (id) navigate(`/rooms/trainbook/${id}`);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // กำหนด Columns ของ Table
  const columns: ColumnsType<RoomInterface> = [
    {
      title: "ลำดับ",
      key: "index",
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "ชื่อห้อง",
      dataIndex: "RoomName",
      key: "RoomName",
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
      render: (record: RoomInterface) => (
        <Space>
          <Button type="primary" onClick={() => handleBooking(record.ID!)}>
            จอง
          </Button>
          {userRole === "admin" && (
            <>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/rooms/edit/${record.ID}`)}
              >
                แก้ไข
              </Button>
              <Popconfirm
                title="ยืนยันการลบห้อง?"
                onConfirm={() =>
                  record.ID !== undefined && handleDelete(record.ID)
                }
                okText="ใช่"
                cancelText="ไม่"
              >
                <Button danger icon={<DeleteOutlined />}>
                  ลบ
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Row>
        <Col span={12}>
          <h2>จัดการข้อมูลห้อง</h2>
        </Col>
        <Col span={12} style={{ textAlign: "right" }}>
          {userRole === "admin" && (
            <Space>
              <Link to="/employees">
                <Button type="default" icon={<HomeOutlined />}>
                  หน้าแรก
                </Button>
              </Link>
              <Link to="/rooms/create">
                <Button type="primary" icon={<PlusOutlined />}>
                  สร้างห้อง
                </Button>
              </Link>
            </Space>
          )}
        </Col>
      </Row>
      <Divider />
      {rooms.length === 0 && !loading ? (
        <Empty description="ไม่มีข้อมูลห้องในขณะนี้" />
      ) : (
        <Table
          rowKey="ID"
          columns={columns}
          dataSource={rooms}
          loading={loading}
          style={{ width: "100%", marginTop: "20px" }}
        />
      )}
    </>
  );
}

export default Rooms;
