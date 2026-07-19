package model

type GymLocation struct {
	ID        int64
	Name      string
	Latitude  float64
	Longitude float64
	Rating    *int
}

type GymEquipment struct {
	ID   int64
	Name string
}

type GymLocationEquipment struct {
	ID             int64
	GymLocationID  int64
	GymEquipmentID int64
}
