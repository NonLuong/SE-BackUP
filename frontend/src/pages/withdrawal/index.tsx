import { useState, useEffect } from "react";
import { Button, Col, Row, Divider, message, Card } from "antd";
import { LoginOutlined, HistoryOutlined, CreditCardOutlined } from "@ant-design/icons"; // เพิ่ม WalletOutlined และ HistoryOutlined
import { useNavigate } from "react-router-dom";
import logo from "../../assets/wallet.png"; // อย่าลืมนำเข้าภาพโลโก้
import { getDriver } from "../../services/https/Driver/index"; // Import the correct function

function Withdrawal() {
  const navigate = useNavigate();
  const [driverIncome, setDriverIncome] = useState<number>(0);
  const [messageApi, contextHolder] = message.useMessage();
  const myId = localStorage.getItem("id");

  // Use the imported getDriver function directly
  const fetchDriverData = async () => {
    if (!myId) return;
    let res = await getDriver(myId); // Call the correct function with lowercase 'g'
    if (res.status === 200) {
      setDriverIncome(res.data.income);
    } else {
      messageApi.open({
        type: "error",
        content: res.data.error,
      });
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, [myId]);

  const handleWithdrawClick = () => {
    navigate("/withdrawal/money");
  };

  const handleHistoryClick = () => {
    navigate("/withdrawal/statement");
  };

  return (
    <>
      {contextHolder}
      <Divider />
      <Row>
        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
          <Card
            style={{
              background: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(10px)",
              textAlign: "center",
              padding: "30px",
              boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 12px",
              borderRadius: "10px",
              border: "none",
              maxWidth: "2000px",
              margin: "0 auto",
            }}
          >
            <h2 style={{ fontSize: "50px", fontWeight: "bold", color: "#9333EA", marginBottom: "20px" }}>
              กระเป๋าเงิน
            </h2>
            <img
              src={logo}
              alt="logo"
              style={{
                width: "200px",
                marginBottom: "20px",
                borderRadius: "8px",
              }}
            />
            <h3 style={{ fontSize: "20px", color: "#47456C", marginBottom: "20px" }}>
              ยอดเงินของคุณ
            </h3>
            <h3 style={{ fontSize: "25px", color: "#47456C" }}>
              <CreditCardOutlined style={{ color: "#7F6BCC", marginRight: "8px" }} />
              {driverIncome} บาท
            </h3>
            <Button
              type="primary"
              size="large"
              style={{
                backgroundColor: "#7F6BCC",
                borderColor: "#7F6BCC",
                marginTop: "20px",
                width: "100%",
                borderRadius: "5px",
                fontSize: "18px",
              }}
              onClick={handleWithdrawClick}
              icon={<LoginOutlined />}
            >
              เบิกเงิน
            </Button>
            <Button
              type="default"
              size="large"
              style={{
                backgroundColor: "#DAD6EF",
                borderColor: "#DAD6EF",
                marginTop: "10px",
                width: "100%",
                borderRadius: "5px",
                fontSize: "18px",
              }}
              onClick={handleHistoryClick}
              icon={<HistoryOutlined />}
            >
              ประวัติการทำรายการ
            </Button>
          </Card>
        </Col>
      </Row>
    </>
  );
}

export default Withdrawal;
