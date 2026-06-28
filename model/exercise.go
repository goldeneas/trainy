package model

type Exercise struct {
	ID           int64
	Name         string
	Notes        string
	Instructions string
	ImageID      *int64
}

type ExerciseInstance struct {
	ID         int64
	RestTime   *int
	TimeUnitID *int64
	ExerciseID int64
	RoutineID  int64
}

type SetInfo struct {
	ID                 int64
	Ord                int
	ExerciseInstanceID int64
	Reps               int
	Weight             int
}
