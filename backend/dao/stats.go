package dao

import (
	dto_response "github.com/goldeneas/trainy/dto/response"
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type StatsDao interface {
	GetActualRoutinesThisMonth(dbtx sqlw.DBTX) ([]model.ActualRoutine, error)
	GetFrequencyThisWeek(dbtx sqlw.DBTX) int
	GetTotalWorkouts(dbtx sqlw.DBTX) int
	GetWeeklyWorkoutHourDistributionThisMonth(dbtx sqlw.DBTX) ([]dto_response.WeeklyWorkoutHourDistribution, error)
	GetMuscleGroupDistributionThisMonth(dbtx sqlw.DBTX) ([]dto_response.MuscleGroupDistribution, error)
	// GetExerciseStatsByID(dbtx sqlw.DBTX, id int64) (*dto_response.ExerciseStats, error)
}
