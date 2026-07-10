package model

type ExerciseProgression struct {
	ID    int64
	Name  string
	Notes *string
}

type ExerciseProgressionEntry struct {
	ID                    int64
	ExerciseID            int64
	ExerciseProgressionID int64
}
