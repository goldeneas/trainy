package dto_request

type CreateExercise struct {
	Name           string  `json:"name"`
	Notes          string  `json:"notes"`
	Instructions   string  `json:"instructions"`
	ImageID        *int64  `json:"image_id"`
	RepUnitID      int64   `json:"rep_unit_id"`
	MuscleGroupIDs []int64 `json:"muscle_group_ids"`
}

type UpdateExercise struct {
	Name           string  `json:"name"`
	Notes          string  `json:"notes"`
	Instructions   string  `json:"instructions"`
	ImageID        *int64  `json:"image_id"`
	RepUnitID      int64   `json:"rep_unit_id"`
	MuscleGroupIDs []int64 `json:"muscle_group_ids"`
}

type RegisterPlannedExercise struct {
	RestTime        *int             `json:"rest_time"`
	TimeUnitID      *int64           `json:"time_unit_id"`
	ExerciseID      int64            `json:"exercise_id"`
	RoutineID       int64            `json:"routine_id"`
	Notes           *string          `json:"notes"`
	PlannedSetInfos []PlannedSetInfo `json:"planned_set_infos"`
}

type PlannedSetInfo struct {
	Ord               int    `json:"ord"`
	PlannedExerciseID int64  `json:"planned_exercise_id"`
	Reps              int    `json:"reps"`
	Notes             string `json:"notes"`
}
