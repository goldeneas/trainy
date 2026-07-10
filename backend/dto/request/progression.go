package dto_request

type CreateExerciseProgression struct {
	Name  string  `json:"name"`
	Notes *string `json:"notes"`
}

type UpdateExerciseProgression struct {
	Name  string  `json:"name"`
	Notes *string `json:"notes"`
}

type CreateExerciseProgressionEntry struct {
	ExerciseID            int64 `json:"exercise_id"`
	ExerciseProgressionID int64 `json:"exercise_progression_id"`
}

type UpdateExerciseProgressionEntry struct {
	ExerciseID            int64 `json:"exercise_id"`
	ExerciseProgressionID int64 `json:"exercise_progression_id"`
}
