package entity

import (
	"time"
	"gorm.io/gorm"
)

type Message struct {
	gorm.Model  
	Content     string   `json:"content"`
	MessageType string   `json:"message_type"`
	ReadStatus  bool     `json:"read_status"`
	SendTime    time.Time `json:"send_time"`
	SenderID    uint      `json:"sender_id"`
	SenderType  string    `json:"sender_type"`

	RoomID      uint      `json:"room_id"`
	RoomChat    RoomChat  `gorm:"foreignKey:RoomID;constraint:OnDelete:CASCADE" json:"room_chat"`


	PassengerID uint      `json:"passenger_id"`
	Passenger   Passenger `gorm:"foreignKey:PassengerID;constraint:OnDelete:SET NULL" json:"passenger"`


	BookingID   uint      `json:"booking_id"`
	Booking     Booking   `gorm:"foreignKey:BookingID;constraint:OnDelete:SET NULL" json:"booking"`

	
	DriverID    uint      `json:"driver_id"`
	Driver      Driver    `gorm:"foreignKey:DriverID;constraint:OnDelete:SET NULL" json:"driver"`
}
