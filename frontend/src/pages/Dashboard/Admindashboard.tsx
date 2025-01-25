import React, { useEffect, useState } from "react";
import { Table, Row, Col, Card, Statistic } from "antd";
import { StockOutlined, AuditOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import AdminSidebar from "../../components/sider/AdminSidebar";
import { GetCommission } from "../../services/https/Driver/withdrawalAPI";
import { listEmployees } from "../../services/https/Employee/index";
import { listDrivers } from "../../services/https/Driver/index";
import { GetTrainers } from "../../services/https/TainerAPI"; // เพิ่มการ import สำหรับ trainers
import { listPassenger } from "../../services/https/Passenger/index"; // เพิ่มการ import สำหรับ passengers
import "./Admindashboard.css";

const Admindashboard: React.FC = () => {
  const [commissionData, setCommissionData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [totalDrivers, setTotalDrivers] = useState<number>(0);
  const [totalTrainers, setTotalTrainers] = useState<number>(0); // เพิ่ม state สำหรับจำนวน trainers
  const [totalPassengers, setTotalPassengers] = useState<number>(0); // เพิ่ม state สำหรับจำนวน passengers

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ดึงข้อมูล commission
        const commissions = await GetCommission();
        commissions.sort((a: any, b: any) => b.commission_id - a.commission_id);
        setCommissionData(commissions);

        // ดึงข้อมูล employees, drivers, trainers และ passengers
        const [employees, drivers, trainersResponse, passengersResponse] = await Promise.all([
          listEmployees(),
          listDrivers(),
          GetTrainers(), // ดึงข้อมูล trainers
          listPassenger(), // ดึงข้อมูล passengers
        ]);

        // ตั้งค่าจำนวนข้อมูล
        setTotalEmployees(employees.length);
        setTotalDrivers(drivers.length);
        setTotalTrainers(trainersResponse.data ? trainersResponse.data.length : 0); // ตั้งค่า trainers

        if (passengersResponse && Array.isArray(passengersResponse.passengers)) {
          setTotalPassengers(passengersResponse.passengers.length); // ตั้งค่า passengers
        } else {
          console.error("Unexpected passengers data format:", passengersResponse);
          setTotalPassengers(0);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const columns = [
    {
      title: "ลำดับ",
      key: "index",
      render: (_: any, __: any, index: number) =>
        pagination.pageSize * (pagination.current - 1) + index + 1,
    },
    {
      title: "จำนวนคอมมิชชั่น",
      dataIndex: "commission_amount",
      key: "commissionAmount",
      render: (amount: number) => `${amount.toFixed(2)} บาท`,
    },
    {
      title: "จำนวนคอมมิชชั่นรวม (หัก 30%)",
      dataIndex: "commission_total",
      key: "commissionTotal",
      render: (total: number) => `${total.toFixed(2)} บาท`,
    },
    {
      title: "วันที่คอมมิชชั่น",
      dataIndex: "commission_date",
      key: "commissionDate",
      render: (date: string) => new Date(date).toLocaleDateString("th-TH"),
    },
  ];

  const totalWithdrawals = commissionData.length;

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      <div className="admin-dashboard-content">
        <h1 className="dashboard-title">Dashboard</h1>

        {/* First Row: จำนวนพนักงาน, จำนวนผู้ขับขี่, จำนวนเทรนเนอร์, จำนวนผู้โดยสาร */}
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
                value={totalTrainers}
                prefix={<UserOutlined />}
                valueStyle={{ fontSize: "38px", fontWeight: "bold", marginTop: "10px" }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className="dashboard-card">
              <Statistic
                title="จำนวนผู้โดยสาร"
                value={totalPassengers}
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
                value={commissionData.reduce((acc, curr) => acc + curr.commission_total, 0).toFixed(2)}
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
      </div>
    </div>
  );
};

export default Admindashboard;
