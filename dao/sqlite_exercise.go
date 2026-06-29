package dao

import (
	"database/sql"

	"github.com/goldeneas/trainy/model"
)

type SQLiteExerciseDAO struct {
	db *sql.DB
}

func NewSQLiteExerciseDAO(db *sql.DB) ExerciseDAO {
	return &SQLiteExerciseDAO{
		db: db,
	}
}

func (d *SQLiteExerciseDAO) InsertExercise(m *model.Exercise) (int64, error) {
	res, err := d.db.Exec(`INSERT INTO Exercise(name, notes, instructions, image_id)
		VALUES (?, ?, ?, ?)`, m.Name, m.Notes, m.Instructions, m.ImageID)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteExerciseDAO) InsertPlannedExercise(m *model.PlannedExercise) (int64, error) {
	res, err := d.db.Exec(`INSERT INTO PlannedExercise(rest_time, time_unit_id, exercise_id,
		routine_id) VALUES (?, ?, ?, ?)`, m.RestTime, m.TimeUnitID, m.ExerciseID, m.RoutineID)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteExerciseDAO) InsertSetInfo(m *model.SetInfo) (int64, error) {
	res, err := d.db.Exec(`INSERT INTO SetInfo (ord, exercise_inst_id, reps, notes)
		VALUES (?, ?, ?, ?)`, m.Ord, m.PlannedExerciseID, m.Reps, m.Notes)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteExerciseDAO) GetExerciseByID(id int64) (*model.Exercise, error) {
	var m model.Exercise
	row := d.db.QueryRow(`SELECT id, name, notes, instructions, image_id
		FROM Exercise WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.Name, &m.Notes, &m.Instructions, &m.ImageID)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteExerciseDAO) GetPlannedExerciseByID(id int64) (*model.PlannedExercise, error) {
	var m model.PlannedExercise
	row := d.db.QueryRow(`SELECT id, rest_time, time_unit_id, exercise_id, routine_id 
		FROM PlannedExercise WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.RestTime, &m.TimeUnitID, &m.ExerciseID, &m.RoutineID)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteExerciseDAO) GetSetInfoByID(id int64) (*model.SetInfo, error) {
	var m model.SetInfo
	row := d.db.QueryRow(`SELECT id, ord, exercise_inst_id, reps, notes FROM SetInfo WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.Ord, &m.PlannedExerciseID, &m.Reps, &m.Notes)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteExerciseDAO) GetAllExercises() ([]model.Exercise, error) {
	rows, err := d.db.Query("SELECT id, name, notes, instructions, image_id FROM Exercise")
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

func (d *SQLiteExerciseDAO) GetAllPlannedExercises() ([]model.PlannedExercise, error) {
	rows, err := d.db.Query(`SELECT id, rest_time, time_unit_id, exercise_id, routine_id
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

func (d *SQLiteExerciseDAO) DeleteExercise(id int64) error {
	_, err := d.db.Exec("DELETE FROM Exercise WHERE id = ?", id)
	return err
}

func (d *SQLiteExerciseDAO) DeletePlannedExercise(id int64) error {
	_, err := d.db.Exec("DELETE FROM PlannedExercise WHERE id = ?", id)
	return err
}

func (d *SQLiteExerciseDAO) DeleteSetInfo(id int64) error {
	_, err := d.db.Exec("DELETE FROM SetInfo WHERE id = ?", id)
	return err
}
