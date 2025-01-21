package controller

import (
	"net/http"
	"project-se/config"
	"project-se/entity"
	"github.com/gin-gonic/gin"
)

func GetPreBookings(c *gin.Context) {
	var bookings []entity.Booking
	
	// ดึงการเชื่อมต่อกับฐานข้อมูล
	db := config.DB()

	// ดึงข้อมูลจากฐานข้อมูลที่ Isprebooking = true
	if err := db.Where("isprebooking = ?", true).Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "ไม่สามารถดึงข้อมูลการจองได้",
		})
		return
	}

	// หากไม่มีข้อมูล
	if len(bookings) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "ไม่พบการจองที่เป็น pre-booking",
		})
		return
	}

	// ส่งผลลัพธ์เป็น JSON
	c.JSON(http.StatusOK, bookings)
}



// UpdateBookingTime - ฟังก์ชันอัปเดต BookingTime
func UpdateBookingTime(c *gin.Context) {
	// รับ BookingID จาก URL params
	bookingID := c.Param("id")
	var booking entity.Booking

	// กำหนด struct สำหรับการอัปเดตเฉพาะฟิลด์ BookingTime
	var updates struct {
		BookingTime string `json:"booking_time"` // กำหนดเฉพาะฟิลด์ BookingTime ที่จะอัปเดต
	}

	// Bind ข้อมูล JSON จาก request ไปที่ updates struct
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ค้นหาการจองจากฐานข้อมูลตาม ID
	if err := config.DB().First(&booking, "id = ?", bookingID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	// ตรวจสอบว่า BookingTime ใหม่ไม่ว่างเปล่า
	if updates.BookingTime == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Booking time cannot be empty"})
		return
	}

	// อัปเดตเฉพาะฟิลด์ BookingTime
	booking.BookingTime = updates.BookingTime
	if err := config.DB().Model(&booking).Update("booking_time", booking.BookingTime).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ส่งข้อมูลที่อัปเดตแล้วกลับไป
	c.JSON(http.StatusOK, gin.H{"data": booking})
}


// DeleteBooking - ฟังก์ชันลบการจอง
func DeleteBooking(c *gin.Context) {
	// รับ BookingID จาก URL params
	bookingID := c.Param("id")

	var booking entity.Booking

	// ค้นหาการจองจากฐานข้อมูลตาม ID
	if err := config.DB().First(&booking, "id = ?", bookingID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	// ลบการจองจากฐานข้อมูล
	if err := config.DB().Delete(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete booking"})
		return
	}

	// ส่งข้อความยืนยันการลบกลับไป
	c.JSON(http.StatusOK, gin.H{"message": "Booking deleted successfully", "data": booking})
}
