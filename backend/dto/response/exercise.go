package dto_response

type Exercise struct {
	ID             int64
	Name           string
	Notes          string
	Instructions   string
	ImageID        *int64
	MuscleGroupIDs []int64
}
