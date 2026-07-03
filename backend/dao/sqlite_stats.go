package dao

import (
	"database/sql"
	"time"

	dto_response "github.com/goldeneas/trainy/dto/response"
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
	"github.com/goldeneas/trainy/timew"
)

type SQLiteStatsDAO struct{}

func NewSQLiteStatsDAO() *SQLiteStatsDAO {
	return &SQLiteStatsDAO{}
}

func (d *SQLiteStatsDAO) GetActualRoutinesThisMonth(dbtx sqlw.DBTX) ([]model.ActualRoutine, error) {
	now := time.Now()
	beginTimestamp := timew.BeginningOfMonth(now).Unix()

	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.ActualRoutine) error {
		return rows.Scan(&t.ID, &t.FinishTimestamp, &t.RoutineID)
	}, `SELECT id, finish_timestamp, routine_id FROM ActualRoutine
		WHERE finish_timestamp > ?`, beginTimestamp)
}

func (d *SQLiteStatsDAO) GetFrequencyThisWeek(dbtx sqlw.DBTX) int {
	now := time.Now()
	beginTimestamp := timew.BeginningOfWeek(now).Unix()

	var count int
	row := dbtx.QueryRow(`SELECT COUNT(*) FROM ActualRoutines
		WHERE finish_timestamp > ?`, beginTimestamp)
	row.Scan(&count)

	return count
}

func (d *SQLiteStatsDAO) GetTotalWorkouts(dbtx sqlw.DBTX) int {
	var count int
	row := dbtx.QueryRow(`SELECT COUNT(*) FROM ActualRoutines`)
	row.Scan(&count)

	return count
}

func (d *SQLiteStatsDAO) GetMuscleGroupDistributionThisMonth(
	dbtx sqlw.DBTX) ([]dto_response.MuscleGroupDistribution, error) {

	now := time.Now()
	beginTimestamp := timew.BeginningOfMonth(now).Unix()

	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *dto_response.MuscleGroupDistribution) error {
		return rows.Scan(&t.Name, &t.Distribution)
	}, `SELECT MG.name,
			COUNT(AR.id)/(SELECT COUNT(*) FROM ActualRoutine WHERE finish_timestamp > ?)
		FROM PlannedExercise AS PL
			JOIN Exercise as EX ON (EX.id = PL.exercise_id)
			JOIN MuscleGroup AS MG ON (EX.muscle_group_id = MG.id)
			JOIN Routine as RO ON (RO.id = PL.routine_id)
			JOIN ActualRoutine as AR ON (RO.id = AR.routine_id)
		WHERE AR.finish_timestamp > ?
		GROUP BY MG.name`, beginTimestamp, beginTimestamp)
}
