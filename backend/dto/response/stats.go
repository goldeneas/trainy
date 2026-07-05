package dto_response

type MuscleGroupDistribution struct {
	Name         string  `json:"name"`
	Distribution float64 `json:"distribution"`
}

type WeeklyWorkoutHourDistribution struct {
	WeekISO string `json:"week_iso"`
	Hours   int64  `json:"hours"`
}
