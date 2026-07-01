package dto_request

type CreateRoutine struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageID     *int64 `json:"image_id"`
}

type RegisterRoutineInstance struct {
	RoutineID      int64           `json:"routine_id"`
	ActualSetInfos []ActualSetInfo `json:"actual_set_infos"`
}

type ActualSetInfo struct {
	Weight           float64 `json:"weight"`
	PlannedSetInfoID int64   `json:"planned_set_info_id"`
	ActualReps       int64   `json:"actual_reps"`
}
