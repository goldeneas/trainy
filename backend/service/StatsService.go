package service

import (
	"database/sql"

	"github.com/goldeneas/trainy/dao"
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
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

func (s *StatsService) GetActualRoutinesThisMonth(dbtx sqlw.DBTX) ([]model.ActualRoutine, error) {
	return s.statsDAO.GetActualRoutinesThisMonth(dbtx)
}

func (s *StatsService) GetFrequencyThisWeek(dbtx sqlw.DBTX) int {
	return s.statsDAO.GetFrequencyThisWeek(dbtx)
}

func (s *StatsService) GetTotalWorkouts(dbtx sqlw.DBTX) int {
	return s.statsDAO.GetTotalWorkouts(dbtx)
}
