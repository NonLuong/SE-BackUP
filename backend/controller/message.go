package controller

import (
	"net/http"
	"project-se/entity"
	"project-se/config"
	"github.com/gin-gonic/gin"
	"strconv"
	
)

// 📥 CreateMessage - บันทึกข้อความลงฐานข้อมูล
// 📥 CreateMessage - บันทึกข้อความลงฐานข้อมูล
func CreateMessage(c *gin.Context) {
    var message entity.Message

    // ตรวจสอบข้อมูลที่ส่งมา
    if err := c.ShouldBindJSON(&message); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // บันทึกข้อความในฐานข้อมูล
    if err := config.DB().Save(&message).Error; err != nil {  // ใช้ Save แทน Create
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // ตรวจสอบว่าข้อความถูกบันทึกหรือไม่
    if message.ID == 0 {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Message not saved"})
        return
    }

    // ส่งข้อมูลกลับ
    c.JSON(http.StatusOK, gin.H{"data": message})
}


// 📥 GetMessagesByBookingID - ดึงข้อความตาม BookingID
func GetMessagesByBookingID(c *gin.Context) {
	bookingIDParam := c.Param("bookingID")
	bookingID, err := strconv.Atoi(bookingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Booking ID"})
		return
	}

	var messages []entity.Message
	result := config.DB().
		Where("booking_id = ?", bookingID).
		Order("send_time ASC").
		Find(&messages)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": messages})
}

// 📥 GetChatMessages - ดึงข้อความแชทตาม roomChatId
func GetChatMessages(c *gin.Context) {
	roomChatId := c.Param("roomChatId")
	if roomChatId == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "roomChatId is required",
		})
		return
	}


	var messages []entity.Message
	if err := config.DB().Where("room_id = ?", roomChatId).Order("send_time ASC").Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to retrieve messages",
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"messages": messages,
	})

	
}

// 📥 DeleteMessage - ลบข้อความออกจากฐานข้อมูล
func DeleteMessage(c *gin.Context) {
	// รับ ID ของข้อความจาก URL parameter
	messageID := c.Param("id")

	// ค้นหาข้อความในฐานข้อมูล
	var message entity.Message
	if err := config.DB().Where("id = ?", messageID).First(&message).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		return
	}

	// ลบข้อความจากฐานข้อมูล
	if err := config.DB().Delete(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete message"})
		return
	}

	// ส่งข้อความยืนยันว่าได้ลบแล้ว
	c.JSON(http.StatusOK, gin.H{"message": "Message deleted successfully"})
}


/*func UpdateMessage(c *gin.Context) {
    messageID := c.Param("id") // รับ message ID จาก URL
    var message entity.Message // ใช้ entity.Message
    var updates struct {
        Content string `json:"content"` // กำหนดเฉพาะฟิลด์ Content ที่จะอัปเดต
    }

    // Bind ข้อมูล JSON จาก request ไปที่ updates struct
    if err := c.ShouldBindJSON(&updates); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // ค้นหาข้อความจากฐานข้อมูลตาม ID
    if err := config.DB().First(&message, "id = ?", messageID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
        return
    }

    // ตรวจสอบว่า content ใหม่ไม่ว่างเปล่า
    if updates.Content == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Content cannot be empty"})
        return
    }

    // อัพเดตเฉพาะฟิลด์ Content
    message.Content = updates.Content
    if err := config.DB().Model(&message).Update("content", message.Content).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // ส่งข้อมูลที่อัปเดตแล้วกลับไป
    c.JSON(http.StatusOK, gin.H{"data": message})
}*/