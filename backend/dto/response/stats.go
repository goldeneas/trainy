package dto_response

type MuscleGroupDistribution struct {
	Name         string  `json:"name"`
	Distribution float64 `json:"distribution"`
}

type WeeklyWorkoutHourDistribution struct {
	WeekISO string `json:"week_iso"`
	Hours   int64  `json:"hours"`
}

type ExerciseStats struct {
	ExerciseID     int64   `json:"exercise_id"`
	MaxWeightKG    float64 `json:"max_weight_kg"`
	AvgSetsPerWeek float64 `json:"avg_sets_per_week"`
	LastWeightKG   float64 `json:"last_weight_kg"`
	TotalLiftedKG  float64 `json:"total_lifted_kg"`
}

type ExerciseWeightStats struct {
	BestWeightAllTimeByRepCount int64 `json:"best_weight_oat_by_reps"`
}
