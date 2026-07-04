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
	row := dbtx.QueryRow(`SELECT COUNT(*) FROM ActualRoutine
		WHERE finish_timestamp > ?`, beginTimestamp)
	row.Scan(&count)

	return count
}

func (d *SQLiteStatsDAO) GetTotalWorkouts(dbtx sqlw.DBTX) int {
	var count int
	row := dbtx.QueryRow(`SELECT COUNT(*) FROM ActualRoutine`)
	row.Scan(&count)

	return count
}

func (d *SQLiteStatsDAO) GetMuscleGroupDistributionThisMonth(
	dbtx sqlw.DBTX) ([]dto_response.MuscleGroupDistribution, error) {

	now := time.Now()
	beginTimestamp := timew.BeginningOfMonth(now).Unix()

	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *dto_response.MuscleGroupDistribution) error {
		return rows.Scan(&t.Name, &t.Distribution)
	}, `SELECT MG.name, CAST(COUNT(*) AS REAL)/(SELECT COUNT(*) FROM ActualSetInfo)
	FROM ActualSetInfo AS ASI
	JOIN ActualRoutine AR ON (ASI.actual_routine_id = AR.id)
	JOIN PlannedSetInfo PSI ON (ASI.set_info_id = PSI.id)
	JOIN PlannedExercise PE ON (PSI.planned_exercise_id = PE.id)
	JOIN Exercise EX ON (EX.id = PE.exercise_id)
	JOIN Routine RO ON (PE.routine_id = RO.id)
	JOIN ExerciseMuscleGroup EMG ON (EMG.exercise_id = EX.id)
	JOIN MuscleGroup MG ON (MG.id = EMG.muscle_group_id)
	WHERE AR.finish_timestamp > ?
	GROUP BY MG.name`, beginTimestamp)
}
