import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/sider/DriverSidebar";
import { Button, Card, Row, Col } from "antd";
import { listDrivers } from "../../services/https/Driver/index";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/wallet.png";
import { LoginOutlined, HistoryOutlined, CreditCardOutlined } from "@ant-design/icons";
import './DriverWithWithdrawal.css';

const DriverWithWithdrawal: React.FC = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const myId = localStorage.getItem("id");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const data = await listDrivers();
        const filteredDrivers = data.filter((drv: any) => drv.ID === parseInt(myId || "0"));
        setDrivers(filteredDrivers);
      } catch (error) {
        console.error("Error fetching drivers:", error);
      }
    };

    fetchDrivers();
  }, [myId]);

  const handleWithdrawClick = () => {
    navigate("/withdrawal/money");
  };

  const handleHistoryClick = () => {
    navigate("/withdrawal/statement");
  };

  return (
    <div className="driver-withdrawal-fullscreen">
      <AdminSidebar />
      <div className="content-container">
        <h2 style={{ fontSize: '44px', fontWeight: 'bold', color: '#6C3C9C' }}>กระเป๋าเงิน</h2>
        <Row gutter={[32, 32]} style={{ marginBottom: "30px" }}></Row>
        <Row justify="center" align="middle">
          <Col span={24} style={{ textAlign: 'center' }}>
            <Card style={{ width: '100%', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
              <img
                src={logo}
                alt="logo"
                style={{ width: '300px', marginBottom: '20px', display: 'block', margin: '0 auto' }}
              />
              <h3 style={{ fontSize: '25px', fontWeight: 'bold', color: '#47456C' }}>ยอดเงินของคุณ</h3>
              <h3 style={{ fontSize: '40px', fontWeight: 'bold', color: '#47456C', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CreditCardOutlined style={{ fontSize: '40px', marginRight: '10px', color: '#7F6BCC' }} />
                {drivers.length > 0 ? drivers[0].Income.toLocaleString() : 0} บาท
              </h3>


              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Button
                    type="primary"
                    size="large"
                    style={{ width: '100%' }}
                    onClick={handleWithdrawClick}
                    icon={<LoginOutlined />}
                  >
                    เบิกเงิน
                  </Button>
                </Col>
                <Col span={24}>
                  <Button
                    type="default"
                    size="large"
                    style={{ width: '100%' }}
                    onClick={handleHistoryClick}
                    icon={<HistoryOutlined />}
                  >
                    ประวัติการทำรายการ
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default DriverWithWithdrawal;
