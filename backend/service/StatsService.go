package service

import (
	"database/sql"

	"github.com/goldeneas/trainy/dao"
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
