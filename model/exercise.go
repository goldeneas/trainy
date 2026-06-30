package model

type Exercise struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	Notes        string `json:"notes"`
	Instructions string `json:"instructions"`
	ImageID      *int64 `json:"image_id"`
}

type PlannedExercise struct {
	ID         int64  `json:"id"`
	RestTime   *int   `json:"rest_time"`
	TimeUnitID *int64 `json:"time_unit_id"`
	ExerciseID int64  `json:"exercise_id"`
	RoutineID  int64  `json:"routine_id"`
}

type SetInfo struct {
	ID                int64  `json:"id"`
	Ord               int    `json:"ord"`
	PlannedExerciseID int64  `json:"planned_exercise_id"`
	Reps              int    `json:"reps"`
	Notes             string `json:"notes"`
}
