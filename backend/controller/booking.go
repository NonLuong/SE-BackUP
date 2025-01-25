package controller

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"project-se/config"
	"project-se/entity"
	
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket" // เพิ่มการ import WebSocket
)

/*func CreateBooking(c *gin.Context) {
    var booking entity.Booking

    // ตรวจสอบ JSON ที่ส่งมา
    if err := c.ShouldBindJSON(&booking); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
        return
    }

    // เชื่อมต่อฐานข้อมูล
    db := config.DB()

    // บันทึกข้อมูลลงในฐานข้อมูล
    if err := db.Create(&booking).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create booking"})
        return
    }

    // ส่งข้อมูลที่สร้างกลับไปยัง client
    c.JSON(http.StatusCreated, gin.H{
        "message": "Booking created successfully",
        "data":    booking,
    })
}*/

// ดึงข้อมูล Booking ทั้งหมด
func GetAllBookings(c *gin.Context) {
	var bookings []entity.Booking
	db := config.DB()

	if err := db.Preload("StartLocation").Preload("Destination").Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    bookings,
	})
}


func GetAllVehicles(c *gin.Context) {
	var vehicles []entity.NametypeVechicle
	db := config.DB()

	if err := db.Preload("VehicleType").Find(&vehicles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch vehicles",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    vehicles,
	})
}

// ดึงข้อมูล Booking ตาม ID
func GetBookingByID(c *gin.Context) {
	var booking entity.Booking
	db := config.DB()

	id := c.Param("id")
	if err := db.Preload("StartLocation").Preload("Destination").First(&booking, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    booking,
	})
}


func CreateBooking(c *gin.Context) {
	var booking entity.Booking

	// ตรวจสอบข้อมูลการจองจาก JSON
	if err := c.ShouldBindJSON(&booking); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// กำหนดค่าเริ่มต้น
	/*if booking.StatusBooking == "" {
		booking.StatusBooking = "Pending"
	}
	if booking.BookingTime == "" {
		booking.BookingTime = fmt.Sprintf("%v", time.Now())
	}*/

	// บันทึกข้อมูลการจอง
	db := config.DB()
	if err := db.Create(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create booking"})
		return
	}

	// ส่งข้อมูลการจองกลับไป
	c.JSON(http.StatusCreated, gin.H{
		"message": "Booking created successfully",
		"data":    booking,
	})
}


// ฟังก์ชันคำนวณระยะทางระหว่างสองพิกัด (ใช้ Haversine Formula)
func calculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const EarthRadius = 6371.0 // รัศมีโลก (กิโลเมตร)

	// แปลงค่าองศาเป็นเรเดียน
	dlat := degToRad(lat2 - lat1)
	dlon := degToRad(lon2 - lon1)

	// คำนวณระยะทางด้วย Haversine formula
	a := math.Sin(dlat/2)*math.Sin(dlat/2) +
		math.Cos(degToRad(lat1))*math.Cos(degToRad(lat2))*math.Sin(dlon/2)*math.Sin(dlon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	// คืนค่าระยะทางเป็นกิโลเมตร
	return EarthRadius * c
}

// ฟังก์ชันแปลงจากองศาเป็นเรเดียน
func degToRad(deg float64) float64 {
	return deg * math.Pi / 180
}

// เก็บการเชื่อมต่อ WebSocket ของแต่ละห้อง
var clients = make(map[string]map[*websocket.Conn]bool) // map[roomID] -> set of connections



func addClientConnection(room string, conn *websocket.Conn) {
	if _, exists := clients[room]; !exists {
		clients[room] = make(map[*websocket.Conn]bool)
		fmt.Printf("✅ Room created: %s\n", room)
	}
	clients[room][conn] = true
	fmt.Printf("✅ Added connection to room %s\n", room)
}


// อัปเกรด HTTP เป็น WebSocket
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // อนุญาตทุก origin (เฉพาะสำหรับการพัฒนา)
	},
}

func DriverWebSocketHandler(c *gin.Context) {
	driverID := c.Param("driverID") // ดึง driverID จาก URL

	// อัปเกรดการเชื่อมต่อเป็น WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("❌ Failed to upgrade WebSocket connection:", err)
		return
	}
	defer conn.Close()

	// เพิ่มการเชื่อมต่อไปยัง clients
	room := driverID
	addClientConnection(room, conn)
	fmt.Printf("✅ WebSocket connection established for driver %s\n", driverID)

	// อ่านข้อความจาก WebSocket (เพื่อรักษาการเชื่อมต่อ)
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			log.Println("❌ Error reading message from WebSocket:", err)
			break
		}
	}
}

func sendMessageToDriver(room string, bookingID uint) {
	fmt.Println("🔍 Debug: Start sendMessageToDriver")
	fmt.Printf("🛠️ Room: %s | BookingID: %d\n", room, bookingID)
	fmt.Printf("🛠️ Current Clients: %+v\n", clients)

	conn, exists := clients[room]
	if !exists {
		fmt.Println("❌ Room does not exist in clients.")
		log.Printf("No active connection for driver %s", room)
		return
	}

	if len(conn) == 0 {
		fmt.Println("❌ No active connections in the specified room.")
		log.Printf("No active connections for driver %s", room)
		return
	}

	message := map[string]interface{}{
		"type":      "new_booking",
		"bookingId": bookingID,
	}
	messageJSON, err := json.Marshal(message)
	if err != nil {
		log.Println("❌ Error marshalling booking message:", err)
		return
	}

	for c := range conn {
		err := c.WriteMessage(websocket.TextMessage, messageJSON)
		if err != nil {
			log.Println("❌ Error sending message to driver:", err)
			c.Close()
			delete(clients[room], c)
		} else {
			fmt.Println("✅ Message sent successfully to a connection.")
		}
	}

	log.Printf("📨 Message sent to room %s: %s", room, string(messageJSON))
}




func AcceptBooking(c *gin.Context) {
    db := config.DB()
    bookingID := c.Param("id")

    // ตรวจสอบว่ามีการจองที่สอดคล้องกับ bookingID หรือไม่
    var booking entity.Booking
    if err := db.First(&booking, bookingID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
        return
    }

    // ตรวจสอบสถานะล่าสุดใน entity.BookingStatus
    var currentBookingStatus entity.BookingStatus
    if err := db.Where("booking_id = ?", booking.ID).Order("created_at desc").First(&currentBookingStatus).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Booking status not found"})
        return
    }

    // ตรวจสอบว่าสถานะล่าสุดเป็น "Waiting for driver acceptance" หรือไม่
    if currentBookingStatus.StatusBooking != "Waiting for driver acceptance" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Booking already processed or in an incorrect state"})
        return
    }

    // อัปเดตสถานะเป็น "Accepted"
    currentBookingStatus.StatusBooking = "Accepted"
    if err := db.Save(&currentBookingStatus).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update booking status"})
        return
    }

    // ส่งข้อมูลกลับไป
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "message": "Booking accepted successfully",
        "data": gin.H{
            "booking":        booking,
            "booking_status": currentBookingStatus,
        },
    })
}

// UpdateDriverIDInBooking updates the driver_id for a specific booking
func UpdateDriverIDInBooking(c *gin.Context) {
	db := config.DB()

	// Get the booking ID from the URL parameters
	bookingID := c.Param("id")

	// Parse booking ID to uint
	parsedBookingID, err := strconv.ParseUint(bookingID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid booking ID"})
		return
	}

	// Get the request payload (driver_id)
	var input struct {
		DriverID uint `json:"driver_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Fetch the booking record
	var booking entity.Booking
	if err := db.First(&booking, parsedBookingID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	// Update the driver_id
	booking.DriverID = input.DriverID
	if err := db.Save(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update driver ID in booking"})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Driver ID updated successfully",
		"data": gin.H{
			"booking_id": booking.ID,
			"driver_id":  booking.DriverID,
		},
	})
}

func UpdateBookingStatusToComplete(c *gin.Context) {
	db := config.DB()
	bookingID := c.Param("id")

	// ค้นหา BookingStatus
	var bookingStatus entity.BookingStatus
	if err := db.Where("booking_id = ?", bookingID).First(&bookingStatus).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "BookingStatus not found"})
		return
	}

	// อัพเดทสถานะ BookingStatus
	bookingStatus.StatusBooking = "complete"
	if err := db.Save(&bookingStatus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update BookingStatus"})
		return
	}

	// ส่งข้อมูลกลับไป
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "BookingStatus updated to complete successfully",
		"data":    bookingStatus,
	})
}