import {
  Space,
  Button,
  Col,
  Row,
  Divider,
  Form,
  Input,
  Card,
  message,
  InputNumber,
  Select,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import { RoomInterface } from "../../../interfaces/IRoom";
import { GetRoomById, UpdateRoomById } from "../../../services/https/RoomAPI";
import { GetTrainers } from "../../../services/https/TainerAPI";
import { TrainersInterface } from "../../../interfaces/ITrainer";

function EditRoom() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [messageApi, contextHolder] = message.useMessage();
  const [trainers, setTrainers] = useState<Pick<TrainersInterface, "ID" | "FirstName" | "LastName">[]>([]);
  const [loading, setLoading] = useState(false);
  const [originalData, setOriginalData] = useState<Partial<RoomInterface>>({});
  const [form] = Form.useForm();

  // ฟังก์ชันดึงข้อมูลห้อง
  const fetchRoomData = async () => {
    setLoading(true);
    try {
      const res = await GetRoomById(Number(id));
      if (res && res.status === 200 && res.data) {
        const roomData = {
          RoomName: res.data.room_name, // ชื่อห้อง
          Capacity: res.data.capacity, // ความจุ
          TrainerID: res.data.trainer_id, // เทรนเนอร์
          Detail: res.data.detail, // รายละเอียด
        };
        console.log("Fetched Room Data:", roomData); // ตรวจสอบข้อมูล
        setOriginalData(roomData);
        form.setFieldsValue(roomData); // ตั้งค่าข้อมูลในฟอร์ม
      } else {
        messageApi.error("ไม่สามารถดึงข้อมูลห้องได้");
      }
    } catch (error) {
      console.error("Error fetching room data:", error);
      messageApi.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับ API");
    } finally {
      setLoading(false);
    }
  };  

  // ฟังก์ชันดึงข้อมูลเทรนเนอร์
  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const res = await GetTrainers();
      if (res && res.status === 200 && Array.isArray(res.data)) {
        const mappedTrainers = res.data.map((trainer: any) => ({
          ID: trainer.ID,
          FirstName: trainer.first_name || "ไม่ระบุชื่อ",
          LastName: trainer.last_name || "ไม่ระบุนามสกุล",
        }));
        setTrainers(mappedTrainers);
      } else {
        messageApi.error("ไม่สามารถดึงข้อมูลเทรนเนอร์ได้");
      }
    } catch (error) {
      console.error("Error fetching trainers:", error);
      messageApi.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับ API");
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันอัปเดตข้อมูลห้อง
  const onFinish = async (values: RoomInterface) => {
    const payload = {
      room_name: values.RoomName || originalData.RoomName || "",
      capacity: values.Capacity || originalData.Capacity || 0,
      trainer_id: values.TrainerID || originalData.TrainerID || 0,
      detail: values.Detail || originalData.Detail || "",
    };

    try {
      const res = await UpdateRoomById(Number(id), payload);

      if (res && res.status === 200) {
        messageApi.success(res.data.message || "แก้ไขห้องสำเร็จ");
        setTimeout(() => navigate("/rooms"), 2000);
      } else {
        messageApi.error(res.error || "ไม่สามารถแก้ไขห้องได้");
      }
    } catch (error) {
      console.error("Error updating room:", error);
      messageApi.error("เกิดข้อผิดพลาดในการแก้ไขห้อง");
    }
  };

  useEffect(() => {
    if (id) {
      fetchRoomData();
      fetchTrainers();
    }
  }, [id]);

  return (
    <div>
      {contextHolder}
      <Card>
        <h2>แก้ไขข้อมูลห้อง</h2>
        <Divider />
        <Form name="edit-room" layout="vertical" form={form} onFinish={onFinish}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={24} md={12}>
              <Form.Item
                label="ชื่อห้อง"
                name="RoomName"
                rules={[{ required: true, message: "กรุณากรอกชื่อห้อง" }]}
              >
                <Input placeholder="กรอกชื่อห้อง" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Form.Item
                label="ความจุ"
                name="Capacity"
                rules={[{ required: true, message: "กรุณากรอกความจุ" }]}
              >
                <InputNumber min={1} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Form.Item
                label="เทรนเนอร์"
                name="TrainerID"
                rules={[{ required: true, message: "กรุณาเลือกเทรนเนอร์" }]}
              >
                <Select placeholder="เลือกเทรนเนอร์" loading={loading}>
                  {trainers.map((trainer) => (
                    <Select.Option key={trainer.ID} value={trainer.ID}>
                      {`${trainer.FirstName} ${trainer.LastName}`}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Form.Item
                label="รายละเอียด"
                name="Detail"
                rules={[{ required: true, message: "กรุณากรอกรายละเอียดของห้อง" }]}
              >
                <Input.TextArea rows={4} placeholder="กรอกข้อมูลรายละเอียดของห้อง" />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end">
            <Col>
              <Space>
                <Link to="/rooms">
                  <Button>ยกเลิก</Button>
                </Link>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<PlusOutlined />}
                >
                  บันทึก
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}

export default EditRoom;
