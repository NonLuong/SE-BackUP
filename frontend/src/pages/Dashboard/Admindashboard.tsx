import React, { useEffect, useState } from "react";
import { Table, Row, Col, Card, Statistic, Modal } from "antd";
import { StockOutlined, AuditOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import AdminSidebar from "../../components/sider/AdminSidebar";
import { GetCommission } from "../../services/https/Driver/withdrawalAPI";
import { listEmployees } from "../../services/https/Employee/index";
import { listDrivers } from "../../services/https/Driver/index";
import { listPassenger } from "../../services/https/Passenger/index";
import { GetTrainers } from "../../services/https/TainerAPI"; // Add this import
import "./Admindashboard.css";

const Admindashboard: React.FC = () => {
  const [commissionData, setCommissionData] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentCommissionId, setCurrentCommissionId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [totalDrivers, setTotalDrivers] = useState<number>(0);
  const [totalTrainers, setTotalTrainers] = useState<number>(0); // Add state for trainers

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch commissions
        const commissions = await GetCommission();
        commissions.sort((a: any, b: any) => b.commission_id - a.commission_id);
        setCommissionData(commissions);

        // Fetch employees, drivers, passengers, and trainers
        const [employees, drivers, trainersResponse] = await Promise.all([
          listEmployees(),
          listDrivers(),
          listPassenger(),
          GetTrainers(), // Fetch trainers here
        ]);

        // Set the total counts
        setTotalEmployees(employees.length);
        setTotalDrivers(drivers.length);

        // Check the structure of trainersResponse to make sure it contains the correct data
        console.log(trainersResponse);  // ตรวจสอบข้อมูลที่ได้จาก API

        setTotalTrainers(trainersResponse.data ? trainersResponse.data.length : 0);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);  

  const handleDelete = async (id: string) => {
    try {
      setCommissionData(commissionData.filter((comm: any) => comm.WithdrawalID !== id));
    } catch (error) {
      console.error("Error deleting commission:", error);
    } finally {
      setIsModalVisible(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentCommissionId(null);
  };

  const columns = [
    {
      title: "ลำดับ",
      key: "index",
      render: (_: any, __: any, index: number) =>
        pagination.pageSize * (pagination.current - 1) + index + 1, // คำนวณลำดับ
    },
    {
      title: "จำนวนคอมมิชชั่น",
      dataIndex: "commission_amount",
      key: "commissionAmount",
      render: (amount: number) => `${amount.toFixed(2)} บาท`, // Format to 2 decimal places
    },
    {
      title: "จำนวนคอมมิชชั่นรวม (หัก 30%)",
      dataIndex: "commission_total",
      key: "commissionTotal",
      render: (total: number) => `${total.toFixed(2)} บาท`, // Format to 2 decimal places
    },
    {
      title: "วันที่คอมมิชชั่น",
      dataIndex: "commission_date",
      key: "commissionDate",
      render: (date: string) => new Date(date).toLocaleDateString("th-TH"),
    },
  ];

  const latestCommissionTotal = commissionData.length
    ? commissionData[commissionData.length - 1].commission_total
    : 0;

  const totalWithdrawals = commissionData.length;

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      <div className="admin-dashboard-content">
        <h1 className="dashboard-title">Dashboard</h1>

        {/* First Row: จำนวนพนักงาน, จำนวนผู้ขับขี่, จำนวนผู้ฝึกสอน */}
        <Row gutter={[32, 32]} className="dashboard-row">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className="dashboard-card">
              <Statistic
                title="จำนวนพนักงาน"
                value={totalEmployees}
                prefix={<TeamOutlined />}
                valueStyle={{ fontSize: "38px", fontWeight: "bold", marginTop: "10px" }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className="dashboard-card">
              <Statistic
                title="พนักงงานขับรถ"
                value={totalDrivers}
                prefix={<UserOutlined />}
                valueStyle={{ fontSize: "38px", fontWeight: "bold", marginTop: "10px" }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className="dashboard-card">
              <Statistic
                title="จำนวนเทรนเนอร์"
                value={totalTrainers} // Display total trainers
                prefix={<UserOutlined />}
                valueStyle={{ fontSize: "38px", fontWeight: "bold", marginTop: "10px" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Second Row: จำนวนการถอน, จำนวนคอมมิชชั่นรวม */}
        <Row gutter={[32, 32]} className="dashboard-row">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className="dashboard-card">
              <Statistic
                title="จำนวนการถอน"
                value={totalWithdrawals}
                prefix={<AuditOutlined />}
                valueStyle={{ fontSize: "38px", fontWeight: "bold", marginTop: "10px" }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className="dashboard-card">
              <Statistic
                title="จำนวนคอมมิชชั่นรวม"
                value={latestCommissionTotal.toFixed(2)} // Format to 2 decimal places
                prefix={<StockOutlined />}
                valueStyle={{ fontSize: "38px", fontWeight: "bold", marginTop: "10px" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Commission Table */}
        <Table
          dataSource={commissionData}
          columns={columns}
          rowKey="WithdrawalID"
          pagination={{
            pageSize: 10,
            current: pagination.current,
            onChange: (page) => setPagination({ ...pagination, current: page }),
          }}
          className="commission-table"
        />

        <Modal
          title="Confirm Delete"
          open={isModalVisible}
          onOk={() => handleDelete(currentCommissionId!)}
          onCancel={handleCancel}
          okText="Confirm"
          cancelText="Cancel"
          className="delete-modal"
        >
          <p>Are you sure you want to delete this commission?</p>
        </Modal>
      </div>
    </div>
  );
};

export default Admindashboard;
