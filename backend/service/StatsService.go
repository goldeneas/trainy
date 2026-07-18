package service

import (
	"database/sql"

	"github.com/goldeneas/trainy/dao"
	dto_response "github.com/goldeneas/trainy/dto/response"
	"github.com/goldeneas/trainy/model"
)

type StatsService struct {
	db       *sql.DB
	statsDAO dao.StatsDao
}

func NewStatsService(db *sql.DB, statsDAO dao.StatsDao) *StatsService {
	return &StatsService{
		db:       db,
		statsDAO: statsDAO,
	}
}

func (s *StatsService) GetActualRoutinesThisMonth() ([]model.ActualRoutine, error) {
	return s.statsDAO.GetActualRoutinesThisMonth(s.db)
}

func (s *StatsService) GetFrequencyThisWeek() int {
	return s.statsDAO.GetFrequencyThisWeek(s.db)
}

func (s *StatsService) GetTotalWorkouts() int {
	return s.statsDAO.GetTotalWorkouts(s.db)
}

func (s *StatsService) GetMuscleGroupDistributionThisMonth() ([]dto_response.MuscleGroupDistribution, error) {
	return s.statsDAO.GetMuscleGroupDistributionThisMonth(s.db)
}

func (s *StatsService) GetWeeklyWorkoutHourDistributionThisMonth() ([]dto_response.WeeklyWorkoutHourDistribution,
	error) {

	return s.statsDAO.GetWeeklyWorkoutHourDistributionThisMonth(s.db)
}

func (s *StatsService) GetExerciseWeightStatsByIDAndReps(id int64, reps int64) dto_response.ExerciseWeightStats {
	return s.statsDAO.GetExerciseWeightStatsByIDAndReps(s.db, id, reps)
}
