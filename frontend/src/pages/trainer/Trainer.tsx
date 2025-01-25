import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/sider/AdminSidebar";
import { useNavigate } from "react-router-dom";
import { Table, Space, Card, Row, Col, Statistic, Modal } from "antd";
import { TeamOutlined } from "@ant-design/icons";
import { IoManSharp, IoWoman } from "react-icons/io5";
import { GetTrainers, DeleteTrainerById } from "../../services/https/TainerAPI";
import { TrainersInterface } from "../../interfaces/ITrainer";
import dayjs from "dayjs";

const Trainer: React.FC = () => {
  const [trainers, setTrainers] = useState<TrainersInterface[]>([]);
  const [totalTrainers, setTotalTrainers] = useState(0);
  const [maleCount, setMaleCount] = useState(0);
  const [femaleCount, setFemaleCount] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentTrainerId, setCurrentTrainerId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await GetTrainers();
        if (res.status === 200 && Array.isArray(res.data)) {
          setTrainers(res.data);
          setTotalTrainers(res.data.length);

          const maleTrainers = res.data.filter(
            (trainer) => trainer.gender_id === 1
          );
          const femaleTrainers = res.data.filter(
            (trainer) => trainer.gender_id === 2
          );

          setMaleCount(maleTrainers.length);
          setFemaleCount(femaleTrainers.length);
        }
      } catch (error) {
        console.error("Error fetching trainers:", error);
      }
    };

    fetchTrainers();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const res = await DeleteTrainerById(id);
      if (res.status === 200) {
        setTrainers(trainers.filter((trainer) => trainer.ID !== id));
        setTotalTrainers(totalTrainers - 1);

        const maleTrainers = trainers.filter(
          (trainer) => trainer.ID !== id && trainer.GenderID === 1
        );
        const femaleTrainers = trainers.filter(
          (trainer) => trainer.ID !== id && trainer.GenderID === 2
        );

        setMaleCount(maleTrainers.length);
        setFemaleCount(femaleTrainers.length);
      }
    } catch (error) {
      console.error("Error deleting trainer:", error);
    } finally {
      setIsModalVisible(false);
    }
  };

  const showDeleteModal = (id: number) => {
    setCurrentTrainerId(id);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentTrainerId(null);
  };

  const columns = [
    {
      title: "ชื่อ",
      dataIndex: "first_name",
      key: "first_name",
    },
    {
      title: "นามสกุล",
      dataIndex: "last_name",
      key: "last_name",
    },
    {
      title: "อีเมล",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "วันเกิด",
      key: "birthday",
      render: (record: {
        birthday: string | number | Date | dayjs.Dayjs | null | undefined;
      }) =>
        record.birthday ? dayjs(record.birthday).format("DD/MM/YYYY") : "-",
    },
    {
      title: "เพศ",
      key: "gender",
      render: (record: { gender_id: number }) => {
        return record.gender_id === 1 ? "Male" : "Female";
      },
    },
    {
      title: "แก้ไข/ลบ",
      key: "actions",
      width: 120,
      render: (_text: any, record: any) => (
        <Space size="middle">
          {/* ปุ่ม Edit */}
          <button
            className="AdminRoom-Btn AdminRoom-Edit-Btn"
            onClick={() => navigate(`/trainer/edit/${record.ID}`)}
          >
            Edit
            <svg
              className="AdminRoom-svg AdminRoom-Edit-svg"
              viewBox="0 0 512 512"
            >
              <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32z"></path>
            </svg>
          </button>
          {/* ปุ่ม Delete */}
          <button
            className="AdminRoom-Btn AdminRoom-Delete-Btn"
            onClick={() => showDeleteModal(record.ID)}
          >
            Delete
            <svg
              className="AdminRoom-svg AdminRoom-Delete-svg"
              viewBox="0 0 448 512"
            >
              <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path>
            </svg>
          </button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <AdminSidebar />
      <div
        style={{
          flex: 1,
          padding: "20px",
          backgroundColor: "#EDE8FE",
          overflow: "auto",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
          ระบบจัดการเทรนเนอร์
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
                title="จำนวนเทรนเนอร์ทั้งหมด"
                value={totalTrainers}
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

          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              bordered={false}
              style={{
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                padding: "16px",
              }}
            >
              <Statistic
                title="เทรนเนอร์ (เพศชาย)"
                value={maleCount}
                valueStyle={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#1890ff",
                  textAlign: "center",
                  marginTop: "10px",
                }}
                prefix={<IoManSharp style={{ fontSize: "32px", color: "#000" }} />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              bordered={false}
              style={{
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                padding: "16px",
              }}
            >
              <Statistic
                title="เทรนเนอร์ (เพศหญิง)"
                value={femaleCount}
                valueStyle={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#f5222d",
                  textAlign: "center",
                  marginTop: "10px",
                }}
                prefix={<IoWoman style={{ fontSize: "32px", color: "#000" }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* Trainer Table */}
        <Table
          dataSource={trainers}
          columns={columns}
          rowKey="ID"
          pagination={{ pageSize: 5 }}
          bordered
          size="middle"
          className="AdminRoom-table"
          style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)", // เพิ่มเงา
            overflow: "hidden",
          }}
          scroll={{ x: true }}
        />

        {/* Add Trainer Button */}
        <div style={{ textAlign: "right", marginTop: "20px" }}>
          <button
            onClick={() => navigate("/trainer/create")}
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

        {/* Delete Confirmation Modal */}
        <Modal
          title="ยืนยันการลบ"
          open={isModalVisible}
          onOk={() => handleDelete(currentTrainerId!)}
          onCancel={handleCancel}
          okText="ยืนยัน"
          cancelText="ยกเลิก"
        >
          <p>คุณแน่ใจหรือไม่ว่าต้องการลบเทรนเนอร์นี้?</p>
        </Modal>
      </div>
    </div>
  );
};

export default Trainer;
