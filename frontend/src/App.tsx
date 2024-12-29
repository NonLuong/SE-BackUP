import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home/home"; // นำเข้าหน้า Home
import Chat from "./pages/chat/chat"; // นำเข้าหน้า Chat
import MapComponent from "./pages/startbooking/MapComponent";
import MapDestination from "./pages/MapDestination/MapDestination";
import MapRoute from "./pages/MapRoute/MapRoute";
import RideHistory from "./pages/RideHistory/RideHistory";
import PassengerChat from "./pages/chat/PassengerChat";
import DriverChat from "./pages/chat/DriverChat";
import PromotionCreate from "./pages/promotion/create";
import PromotionEdit from "./pages/promotion/edit";
import Promotion from "./pages/promotion";
import View from "./pages/promotion/promotionview/promotion";
import HomePayment from "./pages/payment/paid/Home";
import Review from "./pages/review/review";
import Payment from "./pages/payment/payment";
import History from "./pages/review/review_history/history";
import Edit from "./pages/review/edit/edit";
import Room from "./pages/room";
import CreateRoom from "./pages/room/create";
import EditRoom from "./pages/room/edit";
import Trainbook from "./pages/room/trainbook";
import Trainer from "./pages/trainer";
import CreateTrainer from "./pages/trainer/create";
import EditTrainer from './pages/trainer/edit';
import Login from "./pages/login/login";
import Driver from "./pages/Driver/Driver";
import Employee from "./pages/Employee/Employee";
import EditEmployee from "./pages/Employee/EditEmployee";
import AddEmployee from "./pages/Employee/AddEmployee";
import Vehicle from "./pages/Vehicle/Vehicle";
import DriverBooking from "./pages/DriverBooking/DriverBooking";


const App: React.FC = () => {
  return (
    <Router>
      <Routes>

      <Route path="/login" element={<Login />} />


      {/* ของเปิ้ล Booking and Chat */}
        <Route path="/" element={<Home />} /> {/* เส้นทางสำหรับหน้า Home */}
        <Route path="/chat" element={<Chat />} /> {/* เส้นทางสำหรับหน้า Chat */}
        <Route path="/map" element={<MapComponent />} /> {/* เส้นทางสำหรับ CompletedBooking */}
        <Route path="/mapdestination" element={<MapDestination />} /> {/* เส้นทางสำหรับ CompletedBooking */}
        <Route path="/maproute" element={<MapRoute />} /> {/* เส้นทางสำหรับ CompletedBooking */}
        <Route path="/RideHistory" element={<RideHistory />} /> {/* เส้นทางสำหรับ CompletedBooking */}
        <Route path="/PassengerChat" element={<PassengerChat />} /> {/* เส้นทางสำหรับ CompletedBooking */}
        <Route path="/DriverChat" element={<DriverChat />} /> {/* เส้นทางสำหรับ CompletedBooking */}
        <Route path="/DriverBooking" element={<DriverBooking />} /> {/* เส้นทางสำหรับ CompletedBooking */}



       {/*ต้อง* promotion */}
        <Route path="/promotion" element={< Promotion />} />
        <Route path="/promotion/create" element={< PromotionCreate />} />
        <Route path="/promotion/edit/:id" element={< PromotionEdit />} />
        <Route path="/promotion/view" element={< View />} />
        



        {/*ฟร้อง Payment and Review */}
        <Route path="/paid" element={< HomePayment />} /> 
        <Route path="/review" element={<Review/>} /> 
        <Route path="/payment" element={<Payment/>} /> 
        <Route path="/review/history" element={<History/>} /> 
        <Route path="/edit" element={<Edit/>} /> 

        {/*นนท์ Room and Trainer */}
        <Route path="/rooms" element={<Room />} />
        <Route path="/rooms/create" element={<CreateRoom />} />
        <Route path="/rooms/edit/:id" element={<EditRoom />} />
        <Route path="/rooms/trainbook/:id" element={<Trainbook />} />
        <Route path="/trainer" element={<Trainer />} />
        <Route path="/trainer/create" element={<CreateTrainer />} />
        <Route path="/trainer/edit/:id" element={<EditTrainer />} />

        {/*น้ำฝน Admin*/}
        <Route path="/Drivers" element={<Driver />} />
        <Route path="/Employees" element={<Employee />} />
        <Route path="/Employee/create" element={<AddEmployee />} />
        <Route path="/Employee/edit" element={<EditEmployee />} />
        <Route path="/Vehicles" element={<Vehicle />} />

      </Routes>
    </Router>
  );
};

export default App;
