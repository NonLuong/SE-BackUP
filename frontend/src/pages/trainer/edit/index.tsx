import { useState, useEffect } from "react";
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
  DatePicker,
  Select,
  Spin,
  Layout,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { TrainersInterface } from "../../../interfaces/ITrainer";
import { Gender } from "../../../interfaces/IGender";
import { GetTrainerById, UpdateTrainerById } from "../../../services/https/TainerAPI";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { GetGender } from "../../../services/https/GenderAPI";
import AdminSidebar from "../../../components/sider/AdminSidebar";

function TrainerEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [messageApi, contextHolder] = message.useMessage();
  const [gender, setGender] = useState<Gender[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [originalData, setOriginalData] = useState<Partial<TrainersInterface>>({});
  const [form] = Form.useForm();

  // Fetch gender options
  const fetchGenders = async () => {
    setLoading(true);
    try {
      const res = await GetGender();
      if (res.status === 200) {
        setGender(res.data);
      } else {
        messageApi.error("ไม่สามารถดึงข้อมูลเพศได้");
      }
    } catch (error) {
      messageApi.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  // Fetch trainer data by ID
  const fetchTrainerById = async (trainerId: string) => {
    setLoading(true);
    try {
      const res = await GetTrainerById(trainerId);
      if (res.status === 200 && res.data) {
        const trainerData = {
          FirstName: res.data.first_name || "",
          LastName: res.data.last_name || "",
          Email: res.data.email || "",
          BirthDay: res.data.birthday ? dayjs(res.data.birthday).toISOString() : "",
          GenderID: res.data.gender_id || undefined,
          rolesId: res.data.rolesId || 0,
        };
        console.log("Fetched Trainer Data:", trainerData);
        setOriginalData(trainerData);
        form.setFieldsValue({
          ...trainerData,
          BirthDay: trainerData.BirthDay ? dayjs(trainerData.BirthDay) : undefined,
        });
      } else {
        messageApi.error("ไม่พบข้อมูลเทรนเนอร์");
        setTimeout(() => navigate("/trainer"), 2000);
      }
    } catch (error) {
      console.error("Error fetching trainer data:", error);
      messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลเทรนเนอร์");
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const onFinish = async (values: TrainersInterface) => {
    const payload: TrainersInterface = {
      FirstName: values.FirstName || originalData.FirstName || "",
      LastName: values.LastName || originalData.LastName || "",
      Email: values.Email || originalData.Email || "",
      BirthDay: values.BirthDay ? dayjs(values.BirthDay).toISOString() : originalData.BirthDay || "",
      GenderID: values.GenderID || originalData.GenderID || 0,
      rolesId: originalData.rolesId || 0,
      message: ""
    };

    console.log("Payload being sent:", payload);

    try {
      const parsedId = parseInt(id || "", 10);
      if (isNaN(parsedId)) {
        throw new Error("Invalid trainer ID");
      }

      const res = await UpdateTrainerById(parsedId, payload);
      if (res.status === 200) {
        messageApi.success("แก้ไขข้อมูลสำเร็จ");
        setTimeout(() => navigate("/trainer"), 2000);
      } else {
        throw new Error(res.message || "เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
      }
    } catch (error: any) {
      console.error("Error updating trainer:", error);
      messageApi.error(error.message || "ไม่สามารถแก้ไขข้อมูลได้");
    }
  };

  useEffect(() => {
    if (id) {
      fetchGenders();
      fetchTrainerById(id);
    }
  }, [id]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminSidebar />
      <Layout.Content style={{ padding: "20px" }}>
        {contextHolder}
        <Spin spinning={loading}>
          <Card>
            <h2>แก้ไขข้อมูล เทรนเนอร์</h2>
            <Divider />
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
            >
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={24} md={12}>
                  <Form.Item
                    label="ชื่อจริง"
                    name="FirstName"
                    rules={[{ required: true, message: "กรุณากรอกชื่อ!" }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={12}>
                  <Form.Item
                    label="นามสกุล"
                    name="LastName"
                    rules={[{ required: true, message: "กรุณากรอกนามสกุล!" }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={12}>
                  <Form.Item
                    label="อีเมล"
                    name="Email"
                    rules={[
                      { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง!" },
                      { required: true, message: "กรุณากรอกอีเมล!" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={12}>
                  <Form.Item
                    label="วัน/เดือน/ปี เกิด"
                    name="BirthDay"
                    rules={[
                      {
                        required: true,
                        message: "กรุณาเลือกวัน/เดือน/ปี เกิด!",
                      },
                    ]}
                  >
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={12}>
                  <Form.Item
                    label="เพศ"
                    name="GenderID"
                    rules={[{ required: true, message: "กรุณาเลือกเพศ!" }]}
                  >
                    <Select placeholder="เลือกเพศ">
                      {gender.map((item) => (
                        <Select.Option key={item.ID} value={item.ID}>
                          {item.gender}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row justify="end">
                <Col>
                  <Space>
                    <Button onClick={() => navigate("/trainer")}>ยกเลิก</Button>
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
        </Spin>
      </Layout.Content>
    </Layout>
  );
}

export default TrainerEdit;
