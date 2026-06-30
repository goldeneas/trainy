package dao

import (
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type SQLiteExerciseDAO struct{}

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

func (d *SQLiteExerciseDAO) InsertSetInfo(dbtx sqlw.DBTX, m *model.SetInfo) (int64, error) {
	res, err := dbtx.Exec(`INSERT INTO SetInfo (ord, exercise_inst_id, reps, notes)
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

func (d *SQLiteExerciseDAO) GetSetInfoByID(dbtx sqlw.DBTX, id int64) (*model.SetInfo, error) {
	var m model.SetInfo
	row := dbtx.QueryRow(`SELECT id, ord, exercise_inst_id, reps, notes FROM SetInfo WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.Ord, &m.PlannedExerciseID, &m.Reps, &m.Notes)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteExerciseDAO) GetAllExercises(dbtx sqlw.DBTX) ([]model.Exercise, error) {
	rows, err := dbtx.Query("SELECT id, name, notes, instructions, image_id FROM Exercise")
	if err != nil {
		return nil, err
	}

	defer rows.Close()
	var list []model.Exercise
	for rows.Next() {
		var m model.Exercise
		if err := rows.Scan(&m.ID, &m.Name, &m.Notes, &m.Instructions, &m.ImageID); err != nil {
			return nil, err
		}

		list = append(list, m)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return list, nil
}

func (d *SQLiteExerciseDAO) GetAllPlannedExercises(dbtx sqlw.DBTX) ([]model.PlannedExercise, error) {
	rows, err := dbtx.Query(`SELECT id, rest_time, time_unit_id, exercise_id, routine_id
		FROM PlannedExercise`)

	if err != nil {
		return nil, err
	}

	defer rows.Close()
	var list []model.PlannedExercise
	for rows.Next() {
		var m model.PlannedExercise

		err := rows.Scan(&m.ID, &m.RestTime, &m.TimeUnitID, &m.ExerciseID, &m.RoutineID)
		if err != nil {
			return nil, err
		}

		list = append(list, m)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return list, nil
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
