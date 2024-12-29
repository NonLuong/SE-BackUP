package entity

import (
	"gorm.io/gorm"
)

type TrainBook struct {
	gorm.Model
	RoomID   uint   `json:"room_id" valid:"required~RoomID is required"` // ID ของห้องที่จอง
	Room     Rooms  `gorm:"foreignKey:RoomID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"room"` // คีย์ต่างประเทศไปยัง Rooms
	Status   string `json:"status" valid:"required~Status is required,matches(^(completed|in-progress)$)~Status must be 'completed' or 'in-progress'"` // สถานะการจอง
	DriverID *uint  `json:"driver_id" valid:"required~DriverID is required"` // ID ของคนขับที่จอง
	Driver   Driver `gorm:"foreignKey:DriverID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"driver"` // คีย์ต่างประเทศไปยัง Drivers
}
