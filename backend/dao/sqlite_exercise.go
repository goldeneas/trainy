package dao

import (
	"database/sql"

	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type SQLiteExerciseDAO struct{}

func NewSQLiteExerciseDAO() *SQLiteExerciseDAO {
	return &SQLiteExerciseDAO{}
}

func (d *SQLiteExerciseDAO) InsertExercise(dbtx sqlw.DBTX, m *model.Exercise) (int64, error) {
	res, err := dbtx.Exec(`INSERT INTO Exercise(name, notes, instructions, image_id, rep_unit_id)
		VALUES (?, ?, ?, ?, ?)`, m.Name, m.Notes, m.Instructions, m.ImageID, m.RepUnitID)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteExerciseDAO) InsertPlannedExercise(dbtx sqlw.DBTX, m *model.PlannedExercise) (int64, error) {
	res, err := dbtx.Exec(`INSERT INTO PlannedExercise(rest_time, time_unit_id, exercise_id,
		routine_id, notes) VALUES (?, ?, ?, ?, ?)`, m.RestTime, m.TimeUnitID, m.ExerciseID, m.RoutineID, m.Notes)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteExerciseDAO) InsertPlannedSetInfo(dbtx sqlw.DBTX, m *model.PlannedSetInfo) (int64, error) {
	res, err := dbtx.Exec(`INSERT INTO PlannedSetInfo (ord, planned_exercise_id, reps, notes)
		VALUES (?, ?, ?, ?)`, m.Ord, m.PlannedExerciseID, m.Reps, m.Notes)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteExerciseDAO) InsertExerciseMuscleGroup(dbtx sqlw.DBTX,
	m *model.ExerciseMuscleGroup) (int64, error) {

	res, err := dbtx.Exec(`INSERT INTO ExerciseMuscleGroup (exercise_id, muscle_group_id)
		VALUES (?, ?)`, m.ExerciseID, m.MuscleGroupID)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteExerciseDAO) GetExerciseByID(dbtx sqlw.DBTX, id int64) (*model.Exercise, error) {
	var m model.Exercise
	row := dbtx.QueryRow(`SELECT id, name, notes, instructions, image_id, rep_unit_id
		FROM Exercise WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.Name, &m.Notes, &m.Instructions, &m.ImageID, &m.RepUnitID)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteExerciseDAO) GetPlannedExerciseByID(dbtx sqlw.DBTX, id int64) (*model.PlannedExercise, error) {
	var m model.PlannedExercise
	row := dbtx.QueryRow(`SELECT id, rest_time, time_unit_id, exercise_id, routine_id, notes 
		FROM PlannedExercise WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.RestTime, &m.TimeUnitID, &m.ExerciseID, &m.RoutineID, &m.Notes)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteExerciseDAO) GetRepUnitByID(dbtx sqlw.DBTX, id int64) (*model.RepUnit, error) {
	var m model.RepUnit
	row := dbtx.QueryRow(`SELECT id, name_singular, name_plural FROM RepUnit WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.NameSingular, &m.NamePlural)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteExerciseDAO) GetPlannedSetInfoByID(dbtx sqlw.DBTX, id int64) (*model.PlannedSetInfo, error) {
	var m model.PlannedSetInfo
	row := dbtx.QueryRow(`SELECT id, ord, planned_exercise_id, reps, notes FROM PlannedSetInfo WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.Ord, &m.PlannedExerciseID, &m.Reps, &m.Notes)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (s *SQLiteExerciseDAO) GetAllSetInfoByPlannedExerciseID(dbtx sqlw.DBTX, id int64) ([]model.PlannedSetInfo, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.PlannedSetInfo) error {
		return rows.Scan(&t.ID, &t.Ord, &t.PlannedExerciseID, &t.Reps, &t.Notes)
	}, `SELECT id, ord, planned_exercise_id, reps, notes
		FROM PlannedSetInfo
		WHERE planned_exercise_id = ?`, id)
}

func (d *SQLiteExerciseDAO) GetAllExercises(dbtx sqlw.DBTX) ([]model.Exercise, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.Exercise) error {
		return rows.Scan(&t.ID, &t.Name, &t.Notes, &t.Instructions, &t.ImageID, &t.RepUnitID)
	}, "SELECT id, name, notes, instructions, image_id, rep_unit_id FROM Exercise")
}

func (d *SQLiteExerciseDAO) GetAllPlannedExercises(dbtx sqlw.DBTX) ([]model.PlannedExercise, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.PlannedExercise) error {
		return rows.Scan(&t.ID, &t.RestTime, &t.TimeUnitID, &t.ExerciseID, &t.RoutineID, &t.Notes)
	}, `SELECT id, rest_time, time_unit_id, exercise_id, routine_id, notes
		FROM PlannedExercise`)
}

func (d *SQLiteExerciseDAO) GetAllExerciseMuscleGroupIDs(dbtx sqlw.DBTX, exerciseID int64) ([]int64, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *int64) error {
		return rows.Scan(t)
	}, `SELECT muscle_group_id FROM ExerciseMuscleGroup WHERE exercise_id = ?`, exerciseID)
}

func (d *SQLiteExerciseDAO) UpdateExerciseByID(dbtx sqlw.DBTX, id int64, info *model.Exercise) error {
	_, err := dbtx.Exec(`UPDATE Exercise SET name = ?, notes = ?, instructions = ?, image_id = ?, rep_unit_id = ? WHERE id = ?`, info.Name, info.Notes, info.Instructions, info.ImageID, info.RepUnitID, id)
	return err
}

func (d *SQLiteExerciseDAO) DeleteExerciseByID(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM Exercise WHERE id = ?", id)
	return err
}

func (d *SQLiteExerciseDAO) DeletePlannedExerciseByID(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM PlannedExercise WHERE id = ?", id)
	return err
}

func (d *SQLiteExerciseDAO) DeletePlannedSetInfoByID(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM PlannedSetInfo WHERE id = ?", id)
	return err
}

func (d *SQLiteExerciseDAO) DeleteExerciseMuscleGroupByID(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM ExerciseMuscleGroup WHERE id = ?", id)
	return err
}

func (d *SQLiteExerciseDAO) DeleteExerciseMuscleGroupsByExerciseID(dbtx sqlw.DBTX, exerciseID int64) error {
	_, err := dbtx.Exec("DELETE FROM ExerciseMuscleGroup WHERE exercise_id = ?", exerciseID)
	return err
}

func (d *SQLiteExerciseDAO) GetAllRepUnits(dbtx sqlw.DBTX) ([]model.RepUnit, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.RepUnit) error {
		return rows.Scan(&t.ID, &t.NameSingular, &t.NamePlural)
	}, "SELECT id, name_singular, name_plural FROM RepUnit")
}

func (d *SQLiteExerciseDAO) GetAllMuscleGroups(dbtx sqlw.DBTX) ([]model.MuscleGroup, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.MuscleGroup) error {
		return rows.Scan(&t.ID, &t.Name)
	}, "SELECT id, name FROM MuscleGroup")
}
