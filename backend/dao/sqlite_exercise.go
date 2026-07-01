package dao

import (
	"database/sql"

	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type SQLiteExerciseDAO struct{}

func NewSQLiteExerciseDAO(db *sql.DB) *SQLiteExerciseDAO {
	return &SQLiteExerciseDAO{}
}

func (d *SQLiteExerciseDAO) InsertExercise(dbtx sqlw.DBTX, m *model.Exercise) (int64, error) {
	res, err := dbtx.Exec(`INSERT INTO Exercise(name, notes, instructions, image_id)
		VALUES (?, ?, ?, ?)`, m.Name, m.Notes, m.Instructions, m.ImageID)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteExerciseDAO) InsertPlannedExercise(dbtx sqlw.DBTX, m *model.PlannedExercise) (int64, error) {
	res, err := dbtx.Exec(`INSERT INTO PlannedExercise(rest_time, time_unit_id, exercise_id,
		routine_id) VALUES (?, ?, ?, ?)`, m.RestTime, m.TimeUnitID, m.ExerciseID, m.RoutineID)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteExerciseDAO) InsertSetInfo(dbtx sqlw.DBTX, m *model.PlannedSetInfo) (int64, error) {
	res, err := dbtx.Exec(`INSERT INTO SetInfo (ord, planned_exercise_id, reps, notes)
		VALUES (?, ?, ?, ?)`, m.Ord, m.PlannedExerciseID, m.Reps, m.Notes)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteExerciseDAO) GetExerciseByID(dbtx sqlw.DBTX, id int64) (*model.Exercise, error) {
	var m model.Exercise
	row := dbtx.QueryRow(`SELECT id, name, notes, instructions, image_id
		FROM Exercise WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.Name, &m.Notes, &m.Instructions, &m.ImageID)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteExerciseDAO) GetPlannedExerciseByID(dbtx sqlw.DBTX, id int64) (*model.PlannedExercise, error) {
	var m model.PlannedExercise
	row := dbtx.QueryRow(`SELECT id, rest_time, time_unit_id, exercise_id, routine_id 
		FROM PlannedExercise WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.RestTime, &m.TimeUnitID, &m.ExerciseID, &m.RoutineID)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteExerciseDAO) GetSetInfoByID(dbtx sqlw.DBTX, id int64) (*model.PlannedSetInfo, error) {
	var m model.PlannedSetInfo
	row := dbtx.QueryRow(`SELECT id, ord, planned_exercise_id, reps, notes FROM SetInfo WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.Ord, &m.PlannedExerciseID, &m.Reps, &m.Notes)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (s *SQLiteExerciseDAO) GetAllSetInfoByPlannedExerciseID(dbtx sqlw.DBTX, id int64) ([]model.PlannedSetInfo, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.PlannedSetInfo) error {
		return rows.Scan(t.ID, t.Ord, t.PlannedExerciseID, t.Reps, t.Notes)
	}, `SELECT id, ord, planned_exercise_id, reps, notes
		FROM SetInfo
		WHERE planned_exercise_id = ?`, id)
}

func (d *SQLiteExerciseDAO) GetAllExercises(dbtx sqlw.DBTX) ([]model.Exercise, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.Exercise) error {
		return rows.Scan(t.ID, t.Name, t.Notes, t.Instructions, t.ImageID)
	}, "SELECT id, name, notes, instructions, image_id FROM Exercise")
}

func (d *SQLiteExerciseDAO) GetAllPlannedExercises(dbtx sqlw.DBTX) ([]model.PlannedExercise, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.PlannedExercise) error {
		return rows.Scan(t.ID, t.RestTime, t.TimeUnitID, t.ExerciseID, t.RoutineID)
	}, `SELECT id, rest_time, time_unit_id, exercise_id, routine_id
		FROM PlannedExercise`)
}

func (d *SQLiteExerciseDAO) DeleteExercise(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM Exercise WHERE id = ?", id)
	return err
}

func (d *SQLiteExerciseDAO) DeletePlannedExercise(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM PlannedExercise WHERE id = ?", id)
	return err
}

func (d *SQLiteExerciseDAO) DeleteSetInfo(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM SetInfo WHERE id = ?", id)
	return err
}
