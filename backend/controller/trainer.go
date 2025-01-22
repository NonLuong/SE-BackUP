package controller

import (
	"net/http"
	"time"
	"fmt"

	"github.com/gin-gonic/gin"
	"project-se/config"
	"project-se/entity"
)

// ดึงข้อมูล Trainer ทั้งหมด
func GetAllTrainer(c *gin.Context) {
	var trainers []entity.Trainers
	db := config.DB()
	if err := db.Find(&trainers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลเทรนเนอร์ได้"})
		return
	}
	c.JSON(http.StatusOK, trainers)
}

// ดึงข้อมูล Trainer ตาม ID
func GetByIDTrainer(c *gin.Context) {
	id := c.Param("id")
	var trainer entity.Trainers
	db := config.DB()
	results := db.Preload("Gender").First(&trainer, id)

	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, trainer)
}

// สร้าง Trainer ใหม่
func CreateTrainer(c *gin.Context) {
	var trainer entity.Trainers
	if err := c.ShouldBindJSON(&trainer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request, unable to map payload"})
		return
	}

	db := config.DB()
	result := db.Create(&trainer)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create trainer"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Trainer created successfully", "trainer": trainer})
}

// อัปเดตข้อมูล Trainer
func UpdateTrainer(c *gin.Context) {
	id := c.Param("id")
	var existingTrainer entity.Trainers
	db := config.DB()

	// ดึงข้อมูลเดิมของ Trainer
	result := db.First(&existingTrainer, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Trainer not found"})
		return
	}

	var updatedTrainer struct {
		FirstName string `json:"FirstName"`
		LastName  string `json:"LastName"`
		Email     string `json:"Email"`
		BirthDay  string `json:"BirthDay"` // ใช้เป็น string ชั่วคราวสำหรับรับค่าจาก Frontend
		GenderID  uint   `json:"GenderID"`
	}
	if err := c.ShouldBindJSON(&updatedTrainer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request, unable to map payload"})
		return
	}

	// อัปเดตเฉพาะฟิลด์ที่เปลี่ยนแปลง
	if updatedTrainer.FirstName != "" {
		existingTrainer.FirstName = updatedTrainer.FirstName
	}
	if updatedTrainer.LastName != "" {
		existingTrainer.LastName = updatedTrainer.LastName
	}
	if updatedTrainer.Email != "" {
		existingTrainer.Email = updatedTrainer.Email
	}
	if updatedTrainer.BirthDay != "" { // ตรวจสอบว่า BirthDay ไม่ใช่ค่าว่าง
		parsedBirthDay, err := time.Parse(time.RFC3339, updatedTrainer.BirthDay) // รูปแบบ ISO8601
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid BirthDay format"})
			fmt.Println("Error parsing BirthDay:", err) // Debug
			return
		}
		existingTrainer.BirthDay = parsedBirthDay
	}	
	if updatedTrainer.GenderID != 0 {
		existingTrainer.GenderID = updatedTrainer.GenderID
	}

	// บันทึกข้อมูลที่อัปเดต
	result = db.Save(&existingTrainer)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update trainer"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Trainer updated successfully", "trainer": existingTrainer})
}

// ลบ Trainer
func DeleteTrainer(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()
	if tx := db.Delete(&entity.Trainers{}, id); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Trainer not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Trainer deleted successfully"})
}
