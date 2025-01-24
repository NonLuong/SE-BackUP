package entity

import (
	"gorm.io/gorm"
)

// โครงสร้าง NametypeVechicle
type NametypeVechicle struct {
	gorm.Model
	NameCar       string      `json:"name_car"`
	BaseFare      float64     `json:"base_fare"`
	PerKm         float64     `json:"per_km"`
	Capacity      int         `json:"capacity"`
	VehicleTypeID uint        `json:"vehicle_type_id"` // Foreign Key
	VehicleType   VehicleType `gorm:"foreignKey:VehicleTypeID"` // เชื่อม belongsTo
}
