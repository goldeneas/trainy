package dto_request

type CreateRoutine struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageID     *int64 `json:"image_id"`
}

type UpdateRoutine struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageID     *int64 `json:"image_id"`
}

type RegisterActualRoutine struct {
	RoutineID       int64           `json:"routine_id"`
	StartTimestamp  int64           `json:"start_timestamp"`
	FinishTimestamp int64           `json:"finish_timestamp"`
	ActualSetInfos  []ActualSetInfo `json:"actual_set_infos"`
}

type ActualSetInfo struct {
	Weight           float64 `json:"weight"`
	PlannedSetInfoID int64   `json:"planned_set_info_id"`
	ActualReps       int64   `json:"actual_reps"`
}
