package main

import (
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"project-se/config"
	"project-se/controller"
	"project-se/middlewares"
)

// WebSocket Upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // อนุญาตทุก Origin
	},
}

// เก็บการเชื่อมต่อ WebSocket ของแต่ละห้อง
var clients = make(map[string]map[*websocket.Conn]bool) // map[roomID] -> set of connections
var broadcast = make(chan controller.Message)           // ใช้ Message จาก controller

// WebSocket Handler สำหรับรับการเชื่อมต่อจากคนขับ
func handleWebSocketConnections(c *gin.Context) {
    conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
    if err != nil {
        log.Println("Error upgrading to WebSocket:", err)
        return
    }
    defer conn.Close()  

    room := c.DefaultQuery("room", "")
    if room == "" {
        log.Println("Room (bookingID) is required")
        return
    }

    log.Printf("WebSocket connected for room: %s", room)

    for {
        _, message, err := conn.ReadMessage()
        if err != nil {
            log.Printf("Error reading from WebSocket room %s: %v", room, err)
            break
        }
        log.Printf("Message from room %s: %s", room, message)
    }

    log.Printf("WebSocket disconnected for room: %s", room)
}

// ฟังก์ชันสำหรับส่งข้อความไปยังห้องที่เชื่อมต่ออยู่
func handleMessages() {
	for {
		msg := <-broadcast
		room := msg.Room

		// ตรวจสอบว่าห้องมี client หรือไม่
		if clients[room] == nil || len(clients[room]) == 0 {
			log.Printf("No clients connected in room: %s. Message dropped.", room)
			continue
		}

		// ส่งข้อความไปยังสมาชิกใน Room
		for conn := range clients[room] {
			err := conn.WriteJSON(msg)
			if err != nil {
				log.Printf("Error sending message to room %s: %v", room, err)
				conn.Close()
				delete(clients[room], conn)
			}
		}
		//log.Printf("Message broadcasted to room %s: %+v", room, msg)
	}
}



func main() {
	const PORT = "8080" // ระบุพอร์ตที่ต้องการรัน

	// เชื่อมต่อฐานข้อมูล
	config.ConnectionDB()
	config.SetupDatabase()

	// สร้าง Gin Router
	r := gin.Default()

	// เปิดใช้ CORS Middleware
	r.Use(CORSMiddleware())

	// Route ที่ไม่ต้องการ Authentication
	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})

	// Routes ที่เกี่ยวข้องกับ Booking และ Messages
	registerRoutes(r)

	// เริ่มต้น Goroutine สำหรับ handleMessages()
	go handleMessages()

	log.Printf("Server running on localhost:%s", PORT)
	r.Run("localhost:" + PORT)
}

// ฟังก์ชันสำหรับ Register Routes
func registerRoutes(r *gin.Engine) {
	// Booking
	r.POST("/startlocation", controller.CreateStartLocation)
	r.POST("/destination", controller.CreateDestination)
	r.POST("/bookings", controller.CreateBooking)
	r.GET("/bookings", controller.GetAllBookings)
	r.GET("/bookings/:id", controller.GetBookingByID)
	r.POST("/api/bookings/accept/:id", controller.AcceptBooking)  // รับงานจากคนขับ


	// WebSocket
	r.GET("/ws", handleWebSocketConnections)

	// Messages
	r.GET("/messages", controller.GetAllMessages)                            // ดึงข้อความทั้งหมด
	r.POST("/messages", controller.CreateMessage)                            // สร้างข้อความใหม่
	r.GET("/messages/booking/:bookingID", controller.GetMessagesByBookingID) // ดึงข้อความตาม Booking ID

	// Promotion Routes
	r.GET("/promotions", controller.GetAllPromotion)
	r.GET("/promotion/:id", controller.GetPromotion)
	r.POST("/promotion", controller.CreatePromotion)
	r.PUT("/promotion/:id", controller.UpdatePromotion)
	r.DELETE("/promotion/:id", controller.DeletePromotion)
	//promotion Chrilden
	r.GET("/discounttype", controller.GetAllD)
	r.GET("/statuspromotion", controller.GetAllStatus)

	// Withdrawal Routes
	r.POST("/withdrawal/money", controller.CreateWithdrawal) 
	r.GET("/withdrawal/statement", controller.GetAllWithdrawal) // เพิ่มเส้นทางดึงข้อมูลการถอนเงินทั้งหมด
	r.GET("/withdrawal/statement/:id", controller.GetWithdrawal)  // เพิ่มเส้นทางดึงข้อมูลการถอนเงินตาม ID
	// Withdrawal Chrilden
	r.GET("/bankname", controller.GetAllBankName) 

	// Routes สำหรับ Room
	r.GET("/rooms", controller.GetRooms)          // ดึงข้อมูลห้องทั้งหมด
	r.GET("/rooms/:id", controller.GetRoomByID)   // ดึงข้อมูลห้องตาม ID
	r.POST("/rooms", controller.CreateRoom)       // สร้างห้องใหม่
	r.PATCH("/rooms/:id", controller.UpdateRoom)  // อัปเดตข้อมูลห้อง
	r.DELETE("/rooms/:id", controller.DeleteRoom) // ลบห้อง

	// Routes สำหรับ Trainer
	r.GET("/trainers", controller.GetAllTrainer)        // ดึงข้อมูล Trainer ทั้งหมด
	r.GET("/trainers/:id", controller.GetByIDTrainer)   // ดึงข้อมูล Trainer ตาม ID
	r.POST("/trainers", controller.CreateTrainer)       // สร้าง Trainer ใหม่
	r.PATCH("/trainers/:id", controller.UpdateTrainer)  // อัปเดตข้อมูล Trainer
	r.DELETE("/trainers/:id", controller.DeleteTrainer) // ลบ Trainer

	r.GET("/gender", controller.GetAllGender)      // ดึงข้อมูล Gender ทั้งหมด
	r.GET("/gender/:id", controller.GetGenderByID) // ดึงข้อมูล Gender ตาม ID

	r.POST("/auth/signin", controller.UniversalSignin)

	// Position Routes
	r.GET("/positions", controller.ListPositions)
	r.GET("/position/:id", controller.GetPosition)

	// Employee Routes
	r.GET("/employees", controller.ListEmployees)
	r.GET("/employees/:id", controller.GetEmployee)
	r.POST("/employees", controller.CreateEmployee)
	r.DELETE("/employee/:id", controller.DeleteEmployee)
	r.PATCH("/employee/:id", controller.UpdateEmployee)

	// Driver Routes
	r.GET("/drivers", controller.GetDrivers)         // ดึงข้อมูล Driver ทั้งหมด
	r.GET("/driver/:id", controller.GetDriverDetail) // ดึงข้อมูล Driver ตาม ID
	r.POST("/drivers", controller.CreateDriver)      // สร้าง Driver ใหม่
	r.PATCH("/driver/:id", controller.UpdateDriver)  // อัปเดตข้อมูล Driver ตาม ID
	r.DELETE("/driver/:id", controller.DeleteDriver) // ลบข้อมูล Driver ตาม ID

	// Passenger Routes
	r.POST("/passengers", controller.CreatePassenger)
	r.GET("/passengers", controller.GetPassengers)
	r.GET("/passengers/:id", controller.GetPassengerDetail)
	r.PUT("/passengers/:id", controller.UpdatePassenger)
	r.DELETE("/passengers/:id", controller.DeletePassenger)

	// Vehicle Routes
	r.POST("/vehicles", controller.CreateVehicle)
	r.GET("/vehicles", controller.GetVehicles)
	r.GET("/vehicles/:id", controller.GetVehicleDetail)
	r.PUT("/vehicles/:id", controller.UpdateVehicle)
	r.DELETE("/vehicles/:id", controller.DeleteVehicle)

	// VehicleType Routes
	r.GET("/vehicletype/:id", controller.GetVehicleType)
	r.GET("/vehicletypes", controller.ListVehicleTypes)

	// Protected Routes (ต้องตรวจสอบ JWT)
	protected := r.Group("/api", middlewares.Authorizes())
	{
		protected.POST("/message", controller.CreateMessage)
		protected.GET("/messages/booking/:bookingID", controller.GetMessagesByBookingID)
	}
}

// CORSMiddleware จัดการ Cross-Origin Resource Sharing (CORS)
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// อนุญาตเฉพาะ Origin ที่ต้องการ
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		// จัดการ Preflight Request
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		// ไปยัง Middleware ถัดไป
		c.Next()
	}
}

