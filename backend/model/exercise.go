package model

type Exercise struct {
	ID           int64
	Name         string
	Notes        string
	Instructions string
	ImageID      *int64
}

type PlannedExercise struct {
	ID         int64
	RestTime   *int
	TimeUnitID *int64
	ExerciseID int64
	RoutineID  int64
}

type PlannedSetInfo struct {
	ID                int64
	Ord               int
	PlannedExerciseID int64
	Reps              int
	Notes             string
}

type ExerciseMuscleGroup struct {
	ID            int64
	ExerciseID    int64
	MuscleGroupID int64
}
