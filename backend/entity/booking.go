package entity

import (
	"gorm.io/gorm"
)

// Booking Entity
type Booking struct {
	gorm.Model
	Beginning     string  `json:"beginning" valid:"required~Beginning is required."`
	Terminus      string  `json:"terminus" valid:"required~Terminus is required."`
	StartTime     string  `json:"start_time" valid:"required~Start time is required."`
	EndTime       string  `json:"end_time" valid:"required~End time is required."`
	Distance      float64 `json:"distance" valid:"float,required~Distance is required."`
	TotalPrice    float64 `json:"total_price" valid:"float,required~Total price is required."`
	BookingTime   string  `json:"booking_time" valid:"required~Booking time is required."`
	BookingStatus string  `json:"booking_status" valid:"required~Booking status is required."`
	
	Vehicle       string  `json:"vehicle" valid:"required~Vehicle is required."`
	
	PassengerID uint `json:"passenger_id" valid:"required~PassengerID is required."`
	Passenger   Passenger `gorm:"foreignKey:PassengerID" json:"passenger" valid:"-"` // ไม่ Validate Nested Struct

	DriverID uint `json:"driver_id" valid:"required~DriverID is required."`
	Driver   Driver `gorm:"foreignKey:DriverID" json:"driver" valid:"-"` // ไม่ Validate Nested Struct

	Messages []Message `gorm:"foreignKey:BookingID" json:"messages" valid:"-"` // ไม่ Validate Nested Struct

	StartLocationID uint `json:"start_location_id" valid:"required~Start Location is required."`
	StartLocation   StartLocation `gorm:"foreignKey:StartLocationID" json:"start_location" valid:"-"` // ไม่ Validate Nested Struct

	DestinationID uint `json:"destination_id" valid:"required~Destination is required."`
	Destination   Destination `gorm:"foreignKey:DestinationID" json:"destination" valid:"-"` // ไม่ Validate Nested Struct
}
