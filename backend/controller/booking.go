package controller

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"project-se/config"
	"project-se/entity"
	"time"

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

	// เชื่อมต่อกับฐานข้อมูล
	db := config.DB()

	// กำหนดค่าเริ่มต้น
	if booking.BookingStatus == "" {
		booking.BookingStatus = "Pending"
	}
	if booking.BookingTime == "" {
		booking.BookingTime = fmt.Sprintf("%v", time.Now())
	}

	// ดึงข้อมูลตำแหน่งเริ่มต้นของผู้โดยสาร
	var startLocation entity.StartLocation
	if err := db.First(&startLocation, booking.StartLocationID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch start location"})
		return
	}

	// บันทึกข้อมูลการจอง
	if err := db.Create(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create booking"})
		return
	}

	// คำนวณหาคนขับที่ใกล้ที่สุด
	var drivers []entity.Driver
	db.Find(&drivers)

	var closestDriver entity.Driver
	minDistance := math.MaxFloat64

	for _, driver := range drivers {
		var driverLocation entity.Location
		if err := db.First(&driverLocation, "driver_id = ?", driver.ID).Error; err != nil {
			fmt.Println("Error fetching driver location:", err)
			continue
		}

		// คำนวณระยะทาง
		distance := calculateDistance(startLocation.Latitude, startLocation.Longitude, driverLocation.Latitude, driverLocation.Longitude)

		if distance < minDistance {
			closestDriver = driver
			minDistance = distance
		}
	}

	// เช็คกรณีไม่มีคนขับที่ใกล้ที่สุด
	if closestDriver.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No driver available"})
		return
	}

	// อัปเดตการจับคู่กับคนขับและสถานะการจอง
	booking.DriverID = closestDriver.ID
	booking.BookingStatus = "Waiting for driver acceptance"
	db.Save(&booking)

	// ส่ง bookingId ไปให้คนขับผ่าน WebSocket
	room := fmt.Sprintf("%d", closestDriver.ID) // ใช้ driverID เป็น room
	fmt.Println("test1")
	sendMessageToDriver(room, booking.ID)
	fmt.Println("test2")
	// ส่งข้อมูลการจองกลับไป
	c.JSON(http.StatusCreated, gin.H{
		"message": "Booking created, waiting for driver acceptance",
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

// ฟังก์ชันการส่งข้อความไปยังคนขับ
func sendMessageToDriver(room string, bookingID uint) {
	fmt.Println("test3")
	fmt.Println("ห้อง driverid:",room,"bookingid :",bookingID)
	if conn, exists := clients[room]; exists && len(conn) > 0 {
		fmt.Println("test4")
		message := map[string]interface{}{
			"type":      "new_booking",
			"bookingId": bookingID,
		}
		messageJSON, err := json.Marshal(message)  //เเปลง json ให้เป็น string/marshal เพราะ socket ไม่อ่าน json
		if err != nil {
			fmt.Println("test5")
			log.Println("Error marshalling booking message:", err)
			return
		}

		for c := range conn {
			err := c.WriteMessage(websocket.TextMessage, messageJSON)
			if err != nil {
				log.Println("Error sending message to driver:", err)
				c.Close()
				delete(clients[room], c)
			}
		}
		log.Printf("Message sent to room %s: %s", room, string(messageJSON))
	} else {
		fmt.Println("test6")
		log.Printf("No active connection for driver %s", room)
	}
}

func AcceptBooking(c *gin.Context) {
	db := config.DB()
	bookingID := c.Param("id")

	var booking entity.Booking
	if err := db.First(&booking, bookingID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	// ตรวจสอบสถานะการจอง
	if booking.BookingStatus != "Waiting for driver acceptance" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Booking already processed or in an incorrect state"})
		return
	}

	// เปลี่ยนสถานะเป็น "Accepted"
	booking.BookingStatus = "Accepted"
	if err := db.Save(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to accept booking"})
		return
	}

	// ส่งข้อมูลที่อัปเดตกลับไป
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Booking accepted successfully",
		"data":    booking,
	})
}
