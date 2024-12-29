import { useState, useEffect } from "react";
import { Space, Table, Button, Col, Row, Divider, message, Popconfirm } from "antd";
import { HomeOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { GetTrainers, DeleteTrainerById } from "../../services/https/TainerAPI";
import { TrainersInterface } from "../../interfaces/ITrainer";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";

function Trainers() {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState<TrainersInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [messageApi, contextHolder] = message.useMessage();

  // ฟังก์ชันดึงข้อมูลเทรนเนอร์
  const getTrainers = async () => {
    setLoading(true);
    try {
      const res = await GetTrainers();
      console.log("Trainer API Response:", res.data); // Debug ข้อมูล API
      if (res.status === 200 && Array.isArray(res.data)) {
        setTrainers(res.data);
      } else {
        messageApi.error(res.error || "ไม่สามารถดึงข้อมูลเทรนเนอร์ได้");
        setTrainers([]);
      }
    } catch (error) {
      messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
      console.error("Error fetching trainers:", error);
      setTrainers([]);
    }
    setLoading(false);
  };
  

  // ฟังก์ชันลบเทรนเนอร์
  const deleteTrainer = async (id: number) => {
    try {
      const res = await DeleteTrainerById(id); // เรียกใช้ DeleteTrainerById

      if (res.status === 200 && res.data) {
        messageApi.success(res.data.message || "ลบสำเร็จ");
        getTrainers(); // อัปเดตข้อมูลใหม่
      } else {
        messageApi.error(res.error || "ไม่สามารถลบข้อมูลได้");
      }
    } catch (error) {
      messageApi.error("เกิดข้อผิดพลาดในการลบข้อมูล");
      console.error("Error deleting trainer:", error);
    }
  };

  useEffect(() => {
    getTrainers();
  }, []);

  const columns: ColumnsType<TrainersInterface> = [
    {
      title: "ลำดับ",
      key: "index",
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "ชื่อ",
      dataIndex: "first_name",
      key: "first_name",
      render: (text) => text || "ไม่มีข้อมูล",
    },
    {
      title: "นามสกุล",
      dataIndex: "last_name",
      key: "last_name",
      render: (text) => text || "ไม่มีข้อมูล",
    },
    {
      title: "อีเมล",
      dataIndex: "email",
      key: "email",
      render: (text) => text || "ไม่มีข้อมูล",
    },
    {
      title: "วัน/เดือน/ปี เกิด",
      key: "birthday",
      render: (record) => (
        <>{record.birthday ? dayjs(record.birthday).format("DD/MM/YYYY") : "ไม่มีข้อมูล"}</>
      ),
    },
    {
      title: "เพศ",
      key: "gender",
      render: (record) => {
        switch (record.gender_id) {
          case 1:
            return "Male";
          case 2:
            return "Female";
          default:
            return "ไม่มีข้อมูล";
        }
      },
    },    
    {
      title: "การกระทำ",
      render: (record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => navigate(`/trainer/edit/${record.ID}`)}
          >
            แก้ไขข้อมูล
          </Button>
          <Popconfirm
            title="ยืนยันการลบเทรนเนอร์นี้?"
            onConfirm={() => deleteTrainer(record.ID)}
            okText="ใช่"
            cancelText="ไม่"
          >
            <Button type="dashed" danger icon={<DeleteOutlined />}>
              ลบ
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Row>
        <Col span={12}>
          <h2>จัดการข้อมูลเทรนเนอร์</h2>
        </Col>
        <Col span={12} style={{ textAlign: "end", alignSelf: "center" }}>
          <Space>
            <Link to="/employees">
              <Button type="default" icon={<HomeOutlined />}>
                หน้าแรก
              </Button>
            </Link>
            <Link to="/trainer/create">
              <Button type="primary" icon={<PlusOutlined />}>
                สร้างข้อมูล
              </Button>
            </Link>
          </Space>
        </Col>
      </Row>
      <Divider />
      <Table
        rowKey="ID"
        columns={columns}
        dataSource={trainers}
        loading={loading}
        style={{ width: "100%", marginTop: 20 }}
      />
    </>
  );
}

export default Trainers;
