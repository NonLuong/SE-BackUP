// import { useState, useEffect } from "react";
// import { Button, Col, Row, Divider, Form, Input, Card, message, DatePicker, InputNumber, Select } from "antd";
// import { PlusOutlined, CopyrightOutlined } from "@ant-design/icons";
// import { WithdrawalInterface } from "../../../interfaces/IWithdrawal";
// import { UsersInterface } from "../../../interfaces/IUser";
// import { GetUsers } from "../../../services/https"; // ใช้ GetUsers ดึงข้อมูลผู้ใช้
// import { CreateWithdrawal } from "../../../services/https/Driver/withdrawalAPI";
// import { useNavigate, Link } from "react-router-dom";
// import { useSpring, animated } from "@react-spring/web";
// import dayjs from 'dayjs';
// import logo from "../../../assets/with.png"; // อย่าลืมนำเข้าภาพโลโก้

// function WithdrawalCreate() {
//   const navigate = useNavigate();
//   const [messageApi, contextHolder] = message.useMessage();
//   const [selectedBankName, setSelectedBank] = useState<string>("");
//   const [form] = Form.useForm();
//   const [userIncome, setUserIncome] = useState<number>(0); // เก็บยอดเงินของผู้ใช้ที่กำลังใช้งาน
//   const [userId, setUserId] = useState<number | null>(null); // เก็บ userId ของผู้ใช้ที่กำลังใช้งาน
//   const [bankname] = useState<any[]>([
//     { ID: "1", bank_name: "ธนาคารกรุงเทพ" },
//     { ID: "2", bank_name: "ธนาคารกสิกรไทย" },
//     { ID: "3", bank_name: "ธนาคารไทยพาณิชย์" },
//     { ID: "4", bank_name: "ธนาคารกรุงไทย" },
//     { ID: "5", bank_name: "ธนาคารทหารไทย" },
//   ]);

//   // ดึงข้อมูลผู้ใช้งานปัจจุบัน
//   const getCurrentUser = async () => {
//     const myId = localStorage.getItem("id");
//     let res = await GetUsers(); // ใช้ API ที่คุณมีเพื่อดึงข้อมูลผู้ใช้
//     if (res.status === 200) {
//       const currentUser = res.data.filter(
//         (user: UsersInterface) => user.ID?.toString() === myId
//       );
//       if (currentUser.length > 0) {
//         setUserIncome(currentUser[0].income);
//         setUserId(currentUser[0].ID); // เก็บ userId ที่กำลังใช้งาน
//       }
//     } else {
//       messageApi.open({
//         type: "error",
//         content: res.data.error,
//       });
//     }
//   };

//   useEffect(() => {
//     getCurrentUser();
//   }, []);

//   // ฟังก์ชันสำหรับส่งข้อมูลการถอนเงิน
//   const onFinish = async (values: WithdrawalInterface) => {
//     if (!userId) {
//       messageApi.open({
//         type: "error",
//         content: "ไม่สามารถระบุผู้ใช้ที่กำลังใช้งานได้",
//       });
//       return;
//     }

//     const withdrawalData = {
//       ...values,
//       bank_name_id: Number(selectedBankName),
//       user_id: userId, // เพิ่ม userId ในข้อมูลการถอน
//     };

//     let res = await CreateWithdrawal(withdrawalData);

//     if (res.status === 200) {
//       messageApi.open({
//         type: "success",
//         content: res.data.message,
//       });
//       setTimeout(() => {
//         navigate("/withdrawal");
//       }, 2000);
//     } else {
//       messageApi.open({
//         type: "error",
//         content: res.data.error,
//       });
//     }
//   };

//   // คำนวณค่าคอมมิชชั่นและยอดสุทธิ
//   const handleWithdrawalAmountChange = (value: number | null) => {
//     if (value === null) return;
//     const commission = value * 0.3;
//     const netAmount = value - commission;
//     form.setFieldsValue({
//       withdrawal_commission: commission,
//       withdrawal_net_amount: netAmount,
//     });
//   };

//   const cardAnimation = useSpring({
//     opacity: 1,
//     transform: "translateY(0)",
//     from: { opacity: 0, transform: "translateY(-50px)" },
//     config: { tension: 250, friction: 20 },
//   });

//   const formAnimation = useSpring({
//     opacity: 1,
//     transform: "translateY(0)",
//     from: { opacity: 0, transform: "translateY(20px)" },
//     delay: 100,
//     config: { tension: 200, friction: 30 },
//   });

//   return (
//     <div
//       style={{
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         height: "110vh",
//         padding: "20px",
//         backgroundColor: "rgba(233, 255, 255, 0.7)",
//       }}
//     >
//       {contextHolder}
//       <animated.div style={cardAnimation}>
//         <Card
//           style={{
//             width: "100%",
//             maxWidth: "2000px",
//             backgroundColor: "rgba(254, 246, 255, 0.65)",
//             borderRadius: "8px",
//             padding: "20px",
//             display: "flex",
//             flexDirection: "column",
//           }}
//         >
//           <h2
//             style={{
//               textAlign: "center",
//               fontSize: "39px",
//               fontWeight: "bold",
//               marginTop: 0,
//               padding: "10px", // เพิ่ม padding เพื่อให้ข้อความไม่ติดขอบ
//               borderRadius: "5px", // เพิ่มมุมมน
//               color: "#47456C", // เปลี่ยนสีข้อความให้ขาวเพื่อให้อ่านง่าย
//             }}
//           >
//             เบิกเงินพนักงาน
//           </h2>
//           <Divider style={{ margin: "10px 0" }} />

//           <img
//             src={logo}
//             alt="Logo"
//             style={{
//               width: "200px",
//               marginBottom: "20px",
//               borderRadius: "8px",
//               display: "block",  // This makes the image behave like a block element
//               marginLeft: "auto",  // This centers the image horizontally
//               marginRight: "auto", // This ensures it's centered on both sides
//             }}
//           />

//           {/* แสดงยอดเงินผู้ใช้ที่กำลังใช้งาน */}
//           <div style={{ textAlign: "center", marginBottom: "20px" }}>
//             <h3 style={{ fontSize: "25px", color: "#47456C" }}>
//               <CopyrightOutlined style={{ color: "#7F6BCC" }} /> {userIncome} บาท
//             </h3>
//           </div>

//           <animated.div style={formAnimation}>
//             <Form
//               name="withdrawalCreate"
//               layout="vertical"
//               onFinish={onFinish}
//               autoComplete="off"
//               style={{
//                 backgroundColor: "rgba(118, 72, 179, 0.13)",
//                 padding: "20px",
//                 borderRadius: "8px",
//               }}
//               form={form}
//             >
//               <Row gutter={[16, 16]}>
//                 {/* Withdrawal Amount and Commission on the same row */}
//                 <Col xs={24} sm={12}>
//                   <Form.Item
//                     label="จำนวนเงินที่ถอน"
//                     name="withdrawal_amount"
//                     rules={[{ required: true, message: "กรุณากรอกจำนวนเงินที่ถอน !" }]}
//                   >
//                     <InputNumber
//                       min={0}
//                       max={userIncome}
//                       style={{ width: "100%" }}
//                       step={1}
//                       precision={0}
//                       onChange={handleWithdrawalAmountChange}
//                     />
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Form.Item
//                     label="ค่าคอมมิชชั่นจากการถอน"
//                     name="withdrawal_commission"
//                     rules={[{ required: true, message: "กรุณากรอกค่าคอมมิชชั่นจากการถอน !" }]}
//                   >
//                     <InputNumber min={0} style={{ width: "100%" }} disabled />
//                   </Form.Item>
//                 </Col>

//                 {/* Net Amount and Withdrawal Date on the same row */}
//                 <Col xs={24} sm={12}>
//                   <Form.Item
//                     label="จำนวนเงินสุทธิหลังหักค่าคอมมิชชั่น"
//                     name="withdrawal_net_amount"
//                     rules={[{ required: true, message: "กรุณากรอกจำนวนเงินสุทธิ !" }]}
//                   >
//                     <InputNumber min={0} style={{ width: "100%" }} disabled />
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Form.Item
//                     label="วันที่ทำการถอน"
//                     name="withdrawal_date"
//                     initialValue={dayjs()}
//                     rules={[{ required: true, message: "กรุณาเลือกวันที่ทำการถอน !" }]}
//                   >
//                     <DatePicker
//                       style={{ width: "100%" }}
//                       disabled
//                       defaultValue={dayjs()}
//                     />
//                   </Form.Item>
//                 </Col>

//                 {/* Bank and Account Number on the same row */}
//                 <Col xs={24} sm={12}>
//                   <Form.Item
//                     label="ธนาคาร"
//                     name="bank_name_id"
//                     rules={[{ required: true, message: "กรุณาเลือกธนาคาร !" }]}
//                   >
//                     <Select
//                       value={selectedBankName}
//                       onChange={(value) => setSelectedBank(value)}
//                       placeholder="เลือกธนาคาร"
//                     >
//                       {bankname.map((bank) => (
//                         <Select.Option key={bank.ID} value={bank.ID}>
//                           {bank.bank_name}
//                         </Select.Option>
//                       ))}
//                     </Select>
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Form.Item
//                     label="หมายเลขบัญชีธนาคาร"
//                     name="withdrawal_bank_number"
//                     rules={[
//                       { required: true, message: "กรุณากรอกหมายเลขบัญชีธนาคาร !" },
//                       {
//                         pattern: /^[0-9]{10}$/,
//                         message: "หมายเลขบัญชีธนาคารต้องเป็นตัวเลข 10 หลัก",
//                       },
//                     ]}
//                   >
//                     <Input
//                       placeholder="กรอกหมายเลขบัญชีธนาคาร"
//                       maxLength={10}
//                       onChange={(e) => {
//                         e.target.value = e.target.value.replace(/\D/g, "");
//                       }}
//                     />
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} sm={24} style={{ textAlign: "center" }}>
//                   <Form.Item>
//                       <Link to="/withdrawal">
//                         <Button block style={{ width: "150px" }}>ยกเลิก</Button>
//                       </Link>
//                       <Button
//                         type="primary"
//                         htmlType="submit"
//                         icon={<PlusOutlined />}
//                         block
//                         style={{
//                           backgroundColor: "#9333EA",
//                           borderColor: "#9333EA",
//                           color: "#fff",
//                           width: "150px",
//                         }}
//                       >
//                         บันทึก
//                       </Button>
//                   </Form.Item>
//                 </Col>
//               </Row>
//             </Form>
//           </animated.div>

//         </Card>
//       </animated.div>
//     </div>
//   );
// }

// export default WithdrawalCreate;
