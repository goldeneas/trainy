package dto_request

type CreateGymLocation struct {
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Rating    *int    `json:"rating"`
}

type UpdateGymLocation struct {
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Rating    *int    `json:"rating"`
}

type CreateGymLocationEquipment struct {
	GymLocationID  int64 `json:"gym_location_id"`
	GymEquipmentID int64 `json:"gym_equipment_id"`
}
