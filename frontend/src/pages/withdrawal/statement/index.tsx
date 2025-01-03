// import { useState, useEffect } from "react";
// import { Row, Col, Card, Divider, message, Button } from "antd";
// import { WithdrawalInterface } from "../../../interfaces/IWithdrawal";
// import { GetWithdrawal, GetBankName } from "../../../services/https/index"; // GetBankName ดึงข้อมูลชื่อธนาคาร
// import dayjs from "dayjs";
// import { Link } from "react-router-dom"; // เพิ่ม Link จาก react-router-dom
// import './Statement.css'; // เพิ่มการ import ไฟล์ CSS สำหรับการตกแต่งเพิ่มเติม

// function Statement() {
//   const [withdrawals, setWithdrawals] = useState<WithdrawalInterface[]>([]);
//   const [bankNames, setBankNames] = useState<any>({}); // เก็บชื่อธนาคารตาม ID
//   const [messageApi, contextHolder] = message.useMessage();
//   const myId = localStorage.getItem("id");
//   const [visibleDetails, setVisibleDetails] = useState<Record<number, boolean>>({}); // state for toggling visibility

//   const toggleDetails = (id: number) => {
//     setVisibleDetails((prevState) => ({
//       ...prevState,
//       [id]: !prevState[id],
//     }));
//   };

//   // ดึงข้อมูลการถอน
//   const getWithdrawal = async () => {
//     let res = await GetWithdrawal();
//     if (res.status === 200) {
//       const filteredWithdrawals = res.data.filter(
//         (withdrawal: WithdrawalInterface) => withdrawal.user_id.toString() === myId
//       );
//       setWithdrawals(filteredWithdrawals);

//       // ดึงข้อมูลชื่อธนาคารทั้งหมด
//       const bankNamesRes = await GetBankName();
//       if (bankNamesRes.status === 200) {
//         // แม็พ BankNameID กับชื่อธนาคาร
//         const bankNamesMap = bankNamesRes.data.reduce((acc: any, bank: any) => {
//           acc[bank.id] = bank.bank_name; // bank.id คือ BankNameID, bank.bank_name คือชื่อธนาคาร
//           return acc;
//         }, {});
//         setBankNames(bankNamesMap); // เก็บข้อมูลชื่อธนาคารที่แม็พแล้ว
//       } else {
//         messageApi.open({
//           type: "error",
//           content: bankNamesRes.data.error,
//         });
//       }
//     } else {
//       messageApi.open({
//         type: "error",
//         content: res.data.error,
//       });
//     }
//   };

//   useEffect(() => {
//     getWithdrawal(); // ดึงข้อมูลการถอนเงิน
//   }, [myId]);

//   return (
//     <Card bordered={false} className="statement-card"> {/* ครอบทั้งหน้า Statement ด้วย Card */}
//       {contextHolder}

//       {/* หัวข้อรายการถอนเงิน */}
//       <Divider orientation="center" className="statement-divider">
//         รายการเบิกเงิน
//       </Divider>

//       <div className="withdrawals-list">
//         {withdrawals.map((withdrawal) => (
//           <Card
//             key={withdrawal.id}
//             className="withdrawal-card"
//             bordered={false}
//           >
//             <Row gutter={[16, 16]} className="card-row">
//               <Col span={16}>
//                 <div className="withdrawal-amount">
//                   เบิกเงิน {withdrawal.withdrawal_amount} บาท
//                 </div>
//               </Col>
//               <Col span={8} className="text-right">
//                 <div className="transaction-date">
//                   <strong>วันทำรายการ:</strong> {dayjs(withdrawal.withdrawal_date).format("DD/MM/YYYY")}
//                 </div>
//               </Col>
//             </Row>

//             <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
//               <Col span={24} className="text-right">
//                 <Button
//                   type="link"
//                   onClick={() => toggleDetails(withdrawal.id!)}
//                   className="details-toggle-btn"
//                 >
//                   {visibleDetails[withdrawal.id!] ? "ซ่อนรายละเอียด" : "แสดงรายละเอียด"}
//                 </Button>
//               </Col>
//             </Row>

//             {/* แสดงข้อมูลเพิ่มเติมเมื่อ visibleDetails เป็น true */}
//             {visibleDetails[withdrawal.id!] && (
//               <>
//                 <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
//                   <Col span={12} className="text-left">
//                     <div className="commission">
//                       <strong>ค่าคอมมิชชั่น </strong> {withdrawal.withdrawal_commission} บาท
//                     </div>
//                   </Col>
//                   <Col span={12} className="text-right">
//                     <div className="bank-name">{bankNames[withdrawal.BankNameID]}</div>
//                   </Col>
//                 </Row>

//                 <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
//                   <Col span={12} className="text-left">
//                     <div className="net-amount">
//                       <strong>จำนวนเงินที่ได้ </strong> {withdrawal.withdrawal_net_amount} บาท
//                     </div>
//                   </Col>
//                   <Col span={12} className="text-right">
//                     <div className="account-number">
//                       <strong>เลขบัญชี</strong> {withdrawal.withdrawal_bank_number}
//                     </div>
//                   </Col>
//                 </Row>
//               </>
//             )}
//           </Card>
//         ))}
//       </div>

//       {/* ปุ่มย้อนกลับอยู่ที่ด้านล่างสุด */}
//       <Row justify="center" style={{ marginTop: "auto", marginBottom: "20px" }}>
//   <Col span={24} style={{ display: "flex", justifyContent: "center" }}>
//     <Link to="/withdrawal">
//       <Button block className="back-button">
//         ย้อนกลับ
//       </Button>
//     </Link>
//   </Col>
// </Row>
//     </Card>
//   );
// }

// export default Statement;
