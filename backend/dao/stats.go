package dao

import (
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type StatsDao interface {
	GetActualRoutinesThisMonth(dbtx sqlw.DBTX) ([]model.ActualRoutine, error)
	GetFrequencyThisWeek(dbtx sqlw.DBTX) int
	GetTotalWorkouts(dbtx sqlw.DBTX) int
}
