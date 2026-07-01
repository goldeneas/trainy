package model

type Routine struct {
	ID          int64
	Name        string
	Description string
	ImageID     *int64
}

type RoutineInstance struct {
	ID              int64
	FinishTimestamp int64
	RoutineID       int64
}

type ActualSetInfo struct {
	ID                int64
	Weight            float64
	RoutineInstanceID int64
	PlannedSetInfoID  int64
	ActualReps        int64
}
