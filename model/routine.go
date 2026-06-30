package model

type Routine struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageID     *int64 `json:"image_id"`
}

type RoutineInstance struct {
	ID              int64 `json:"id"`
	FinishTimestamp int64 `json:"finish_timestamp"`
	RoutineID       int64 `json:"routine_id"`
}

type WeightInfo struct {
	ID                int64   `json:"id"`
	Weight            float64 `json:"weight"`
	RoutineInstanceID int64   `json:"routine_inst_id"`
	SetInfoID         int64   `json:"set_info_id"`
}
