package controller

import (
	
	"net/http"
	"project-se/entity"
	"project-se/config"
	"github.com/gin-gonic/gin"
	"fmt"
	"math"
	
)

func UpdateBookingStatus(c *gin.Context) {
    db := config.DB()
    bookingID := c.Param("id")

    // ตรวจสอบ JSON ที่ส่งมา
    var input struct {
        StatusBooking string `json:"status_booking"`
    }
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
        return
    }

    if input.StatusBooking == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "StatusBooking is required"})
        return
    }

    // ค้นหา bookingStatus ที่เกี่ยวข้อง
    var bookingStatus entity.BookingStatus
    if err := db.First(&bookingStatus, "booking_id = ?", bookingID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "BookingStatus not found"})
        return
    }

    // อัปเดตสถานะ
    bookingStatus.StatusBooking = input.StatusBooking
    if err := db.Save(&bookingStatus).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update booking status"})
        return
    }

    // ตรวจสอบสถานะการจ่ายเงิน
    if input.StatusBooking == "paid" {
        // ดึงข้อมูลการจองที่เกี่ยวข้อง
        var booking entity.Booking
        if err := db.First(&booking, "id = ?", bookingID).Error; err != nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
            return
        }

        // ตรวจสอบว่าการจองยังไม่ได้จับคู่คนขับ
        if booking.DriverID != 0 {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Driver already assigned"})
            return
        }

        // ดึงตำแหน่งเริ่มต้นของผู้โดยสาร
        var startLocation entity.StartLocation
        if err := db.First(&startLocation, "id = ?", booking.StartLocationID).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch start location"})
            return
        }

        // คำนวณหาคนขับที่ใกล้ที่สุด
        var drivers []entity.Driver
        if err := db.Find(&drivers).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch drivers"})
            return
        }

        var closestDriver entity.Driver
        minDistance := math.MaxFloat64

        for _, driver := range drivers {
            var driverLocation entity.Location
            if err := db.First(&driverLocation, "driver_id = ?", driver.ID).Error; err != nil {
                continue
            }

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

        // อัปเดตการจับคู่กับคนขับ
        booking.DriverID = closestDriver.ID
        bookingStatus.StatusBooking = "Waiting for driver acceptance"
        
        if err := db.Save(&bookingStatus).Error; err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update booking status"})
    return
}


        // ส่ง bookingId ไปให้คนขับผ่าน WebSocket
        room := fmt.Sprintf("%d", closestDriver.ID)
        sendMessageToDriver(room, booking.ID)
    }

    // ส่งข้อมูลการอัปเดตกลับไปยัง client
    c.JSON(http.StatusOK, gin.H{
        "status": "success",
        "message": "Booking status updated successfully",
        "data": gin.H{
            "booking_id": bookingStatus.BookingID,
            "status_booking": bookingStatus.StatusBooking,
        },
    })
    
}


func CreateBookingStatus(c *gin.Context) {
	var bookingStatus entity.BookingStatus

	// ตรวจสอบ JSON ที่ส่งมา
	if err := c.ShouldBindJSON(&bookingStatus); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// ตรวจสอบว่า BookingID และ StatusBooking มีค่าที่จำเป็น
	if bookingStatus.BookingID == 0 || bookingStatus.StatusBooking == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "BookingID and StatusBooking are required"})
		return
	}

	// เชื่อมต่อฐานข้อมูล
	db := config.DB()

	// ตรวจสอบว่ามี Booking ที่เกี่ยวข้องหรือไม่
	var booking entity.Booking
	if err := db.First(&booking, bookingStatus.BookingID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	// บันทึกสถานะลงในตาราง bookingstatus
	if err := db.Create(&bookingStatus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create booking status"})
		return
	}

	// ส่งข้อมูลที่บันทึกกลับไปยัง client
	c.JSON(http.StatusCreated, gin.H{
		"message": "Booking status created successfully",
		"data":    bookingStatus,
	})
}


func RejectBooking(c *gin.Context) {
    db := config.DB()
    bookingID := c.Param("id")

    // ค้นหาการจองที่เกี่ยวข้อง
    var booking entity.Booking
    if err := db.First(&booking, bookingID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
        return
    }

    // เปลี่ยนสถานะการจองเป็น "Rejected"
    var bookingStatus entity.BookingStatus
    if err := db.Where("booking_id = ?", booking.ID).Order("created_at desc").First(&bookingStatus).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Booking status not found"})
        return
    }

    // อัปเดตสถานะการจองเป็น Rejected
    bookingStatus.StatusBooking = "Rejected"
    if err := db.Save(&bookingStatus).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update booking status"})
        return
    }

    // ค้นหาตำแหน่งเริ่มต้น
    var startLocation entity.StartLocation
    if err := db.First(&startLocation, "id = ?", booking.StartLocationID).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch start location"})
        return
    }

    // ค้นหาคนขับทั้งหมด
    var drivers []entity.Driver
    if err := db.Find(&drivers).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch drivers"})
        return
    }

    var closestDriver entity.Driver
    minDistance := math.MaxFloat64
    foundDriver := false

    fmt.Println("Searching for closest driver...")

    for _, driver := range drivers {
        // ข้ามคนขับเดิมที่ปฏิเสธงาน
        if driver.ID == booking.DriverID {
            fmt.Printf("Skipping previous driver: %d\n", driver.ID)
            continue
        }

        var driverLocation entity.Location
        if err := db.First(&driverLocation, "driver_id = ?", driver.ID).Error; err != nil {
            continue
        }

        distance := calculateDistance(startLocation.Latitude, startLocation.Longitude, driverLocation.Latitude, driverLocation.Longitude)
        fmt.Printf("Distance to driver %d: %f meters\n", driver.ID, distance)

        if distance < minDistance {
            closestDriver = driver
            minDistance = distance
            foundDriver = true
        }
    }

    if !foundDriver {
        fmt.Println("No available driver found.")
        c.JSON(http.StatusNotFound, gin.H{"error": "No driver available"})
        return
    }

    fmt.Printf("Closest driver: %d\n", closestDriver.ID)

    // อัปเดตการจับคู่กับคนขับใหม่
    booking.DriverID = closestDriver.ID
    if err := db.Save(&booking).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update booking with new driver"})
        return
    }

    // อัปเดตสถานะใหม่เป็น "Waiting for driver acceptance"
    bookingStatus.StatusBooking = "Waiting for driver acceptance"
    if err := db.Save(&bookingStatus).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update booking status to 'Waiting for driver acceptance'"})
        return
    }

    // ส่งข้อความให้คนขับผ่าน WebSocket
    room := fmt.Sprintf("%d", closestDriver.ID)
    sendMessageToDriver(room, booking.ID)

    // ส่งข้อมูลตอบกลับ
    c.JSON(http.StatusOK, gin.H{
        "status":  "success",
        "message": "Booking rejected, new driver assigned successfully",
        "data": gin.H{
            "booking_id": booking.ID,
            "driver_id":  booking.DriverID,
        },
    })
}



func GetCompletedBookings(c *gin.Context) {
	var bookings []entity.BookingStatus
	db := config.DB()

	// ค้นหาข้อมูลการจองที่มีสถานะ 'complete'
	if err := db.Preload("Booking").Where("status_booking = ?", "complete").Find(&bookings).Error; err != nil {
		// ถ้ามีข้อผิดพลาดในการดึงข้อมูล
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch completed bookings"})
		return
	}

	// ส่งข้อมูลการจองที่มีสถานะ 'complete' กลับไป
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    bookings,
	})
}

func GetBookingStatus(c *gin.Context) {
	bookingID := c.Param("id") // ดึงค่า booking ID จาก URL
	var booking entity.BookingStatus
	db := config.DB()

	// ค้นหาสถานะของ booking ที่ตรงกับ ID
	if err := db.Where("id = ?", bookingID).First(&booking).Error; err != nil {
		// ถ้าไม่พบข้อมูล booking
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Booking not found"})
		return
	}

	// ส่งสถานะของ booking กลับไป
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"status":  booking.StatusBooking,
	})
}

