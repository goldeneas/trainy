package dto_request

type CreateRoutine struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageID     *int64 `json:"image_id"`
}

type RegisterRoutineInstance struct {
	RoutineID  int64        `json:"routine_id"`
	WeightInfo []WeightInfo `json:"weight_infos"`
}

type WeightInfo struct {
	Weight    float64 `json:"weight"`
	SetInfoID int64   `json:"set_info_id"`
}
