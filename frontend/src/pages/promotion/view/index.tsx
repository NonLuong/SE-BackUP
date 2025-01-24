import { useState, useEffect } from "react";
import { Row, Col, Divider, message, Image, Card, Tag, Button } from "antd";
import { GetPromotions } from "../../../services/https/indexpromotion";
import dayjs from "dayjs";
import { CopyOutlined } from "@ant-design/icons";
import "./view.css";

export interface PromotionInterface {
  id: number;
  promotion_code: string;
  promotion_name: string;
  promotion_description: string;
  photo: string;
  DiscountTypeID: string;
  discount: number;
  status_promotion_id: number;
  discount_type_id: string;
  use_limit: number;
  use_count: number;
  distance_promotion: number;
  end_date: string;
  discount_type: string;
}

function View() {
  const [promotions, setPromotions] = useState<PromotionInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  const getPromotions = async () => {
    try {
      const res = await GetPromotions();
      if (res.status === 200) {
        const sortedPromotions = res.data.sort((a: PromotionInterface, b: PromotionInterface) => a.status_promotion_id - b.status_promotion_id);
        setPromotions(sortedPromotions);
      } else {
        setPromotions([]);
        messageApi.error(res.data.error);
      }
    } catch (error) {
      messageApi.error("ไม่สามารถดึงข้อมูลโปรโมชันได้");
    }
  };

  useEffect(() => {
    getPromotions();
  }, []);

  const formatDate = (date: string) => dayjs(date).format("DD/MM/YYYY");

  const renderStatus = (statusId: number) => {
    if (statusId === 1) {
      return <Tag color="green" style={{ fontSize: "15px", padding: "5px 10px", borderRadius: "5px" }}>ใช้งานได้</Tag>;
    }
    if (statusId === 2) {
      return <Tag color="red" style={{ fontSize: "15px", padding: "5px 10px", borderRadius: "5px" }}>ปิดการใช้งาน</Tag>;
    }
    return <Tag color="default" style={{ fontSize: "24px", padding: "10px 20px", borderRadius: "20px" }}>ไม่ระบุ</Tag>;
  };

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    messageApi.success("คัดลอกรหัสโปรโมชั่นแล้ว");
  };

  return (
    <div style={{ backgroundColor: "rgb(190, 177, 226)", padding: "40px 20px", minHeight: "100vh" }}>
      {contextHolder}
      <h1 className="custom-heading">
        PROMOTION NOW !
      </h1>
      <Divider />
      <div style={{ marginTop: 20 }}>
        {promotions.map((promotion) => (
          <Row gutter={[16, 16]} key={promotion.id} style={{ marginBottom: 20 }}>
            <Col span={24}>
              <Card
                className="coupon-card"
                style={{
                  border: "1px solid #DAD6EF",
                  borderRadius: "12px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "row",
                  maxWidth: "1400px",
                  margin: "0 auto",
                  backgroundImage: "linear-gradient(135deg,rgb(174, 127, 218),rgb(243, 232, 253))",
                  transition: "transform 0.3s, box-shadow 0.3s",
                }}
                hoverable
              >
                <Row gutter={16} style={{ display: "flex", alignItems: "center", width: "100%" }}>
                  <Col span={8}>
                    <Image
                      alt={promotion.promotion_name ?? "Default Alt Text"}
                      src={promotion.photo ?? "/default-image.jpg"}
                      style={{
                        width: "100%",
                        height: "330px",
                        objectFit: "cover",
                        borderRadius: "20px",
                        border: "3px solid #DAD6EF",
                      }}
                    />
                  </Col>
                  <Col span={16}>
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <div
                          style={{
                            fontSize: "48px",
                            fontWeight: "bold",
                            color: "#47456C",
                            textAlign: "left",
                            marginBottom: "10px",
                          }}
                        >
                          <span>{promotion.promotion_name ?? "ไม่มีรหัสโปรโมชัน"}</span>
                          <span
                            style={{
                              marginLeft: "10px",
                              fontSize: "48px",
                              fontWeight: "bold",
                              color: "rgb(181, 14, 187)",
                            }}
                          >
                            ลด {promotion.discount_type_id == "1" ? `${promotion.discount} บาท` : `${promotion.discount}%`}
                          </span>
                        </div>
                      </Col>
                      <Col span={24}>
                        <Row justify="space-between" align="middle" style={{ position: "relative" }}>
                          <Col>
                            <Tag
                              style={{
                                fontSize: "30px",
                                backgroundColor: "rgba(147, 51, 234, 0.6)",
                                color: "white",
                                padding: "10px 30px",
                                borderRadius: "20px",
                              }}
                            >
                              กรอกโค้ด {promotion.promotion_code}
                              <Button
                                type="text"
                                icon={<CopyOutlined style={{ fontSize: "26px" }} />}
                                onClick={() => copyPromoCode(promotion.promotion_code)}
                                style={{
                                  fontSize: "20px",
                                  padding: "6px 12px",
                                  marginLeft: "10px",
                                  borderRadius: "8px",
                                  color: "white",
                                  transition: "background-color 0.3s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6A56B9")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#7F6BCC")}
                              />
                            </Tag>
                          </Col>
                          <Col>
                            <div style={{ textAlign: "right" }}>{renderStatus(promotion.status_promotion_id)}</div>
                          </Col>
                        </Row>
                      </Col>
                      <Col span={24}>
                        <div
                          style={{
                            padding: "20px",
                            fontSize: "20px",
                            color: "#47456C",
                            fontWeight: "500",
                            textAlign: "left",
                            backgroundColor: "#F2F1FF",
                            borderRadius: "8px",
                          }}
                        >
                          {promotion.promotion_description}
                        </div>
                      </Col>
                      <Col span={24}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "15px 20px",
                            fontSize: "16px",
                            color: "#47456C",
                            fontWeight: "500",
                            backgroundColor: "#F9F7FE",
                            borderRadius: "8px",
                          }}
                        >
                          <div>หมดเขตโปรโมชั่น {formatDate(promotion.end_date)}</div>
                          <div style={{ textAlign: "right" }}>
                            ระยะทาง: {promotion.distance_promotion} กม. / จำกัดสิทธิ์ {promotion.use_limit} คน
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        ))}
      </div>
      <Button
        type="primary"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          backgroundColor: "rgba(146, 51, 234, 0.88)",
          color: "white",
          fontSize: "24px",  // Increased font size for a larger button
          padding: "32px 24px",  // Increased padding
          borderRadius: "12px",
        }}
        onClick={() => (window.location.href = "/home")}
      >
        BACK HOME
      </Button>
    </div>
  );
}

export default View;
