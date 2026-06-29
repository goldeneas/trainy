package dao

import (
	"database/sql"

	"github.com/goldeneas/trainy/model"
)

type SQLiteRoutineDAO struct {
	db *sql.DB
}

func NewSQLiteRoutineDAO(db *sql.DB) RoutineDAO {
	return &SQLiteRoutineDAO{
		db: db,
	}
}

func (d *SQLiteRoutineDAO) InsertRoutine(m *model.Routine) (int64, error) {
	res, err := d.db.Exec("INSERT INTO Routine(name, description, image_id) VALUES (?, ?, ?)",
		m.Name, m.Description, m.ImageID)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteRoutineDAO) RegisterRoutineInstance(r *model.Routine, i []model.WeightInfo) {
	return id, nil
}

func (d *SQLiteRoutineDAO) GetRoutineByID(id int64) (*model.Routine, error) {
	var m model.Routine

	row := d.db.QueryRow("SELECT id, name, description, image_id FROM Routine WHERE id = ?", id)
	err := row.Scan(&m.ID, &m.Name, &m.Description, &m.ImageID)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteRoutineDAO) GetRoutineInstanceByID(id int64) (*model.RoutineInstance, error) {
	var m model.RoutineInstance

	row := d.db.QueryRow("SELECT id, finish_timestamp, routine_id FROM RoutineInstance WHERE id = ?", id)
	err := row.Scan(&m.ID, &m.FinishTimestamp, &m.RoutineID)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteRoutineDAO) GetWeightInfoByID(id int64) (*model.WeightInfo, error) {
	var m model.WeightInfo
	row := d.db.QueryRow(`SELECT id, weight, routine_inst_id, set_info_id FROM WeightInfo WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.Weight, &m.RoutineInstanceID, &m.SetInfoID)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteRoutineDAO) GetAllRoutines() ([]model.Routine, error) {
	rows, err := d.db.Query("SELECT id, name, description, image_id FROM Routine")
	if err != nil {
		return nil, err
	}

	defer rows.Close()
	var list []model.Routine
	for rows.Next() {
		var m model.Routine
		if err := rows.Scan(&m.ID, &m.Name, &m.Description, &m.ImageID); err != nil {
			return nil, err
		}

		list = append(list, m)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return list, nil
}

func (d *SQLiteRoutineDAO) GetAllRoutineInstances() ([]model.RoutineInstance, error) {
	rows, err := d.db.Query("SELECT id, finish_timestamp, routine_id FROM RoutineInstance")
	if err != nil {
		return nil, err
	}

	defer rows.Close()
	var list []model.RoutineInstance
	for rows.Next() {
		var m model.RoutineInstance
		if err := rows.Scan(&m.ID, &m.FinishTimestamp, &m.RoutineID); err != nil {
			return nil, err
		}

		list = append(list, m)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return list, nil
}

func (d *SQLiteRoutineDAO) DeleteRoutine(id int64) error {
	_, err := d.db.Exec("DELETE FROM Routine WHERE id = ?", id)
	return err
}

func (d *SQLiteRoutineDAO) DeleteRoutineInstance(id int64) error {
	_, err := d.db.Exec("DELETE FROM RoutineInstance WHERE id = ?", id)
	return err
}

func (d *SQLiteRoutineDAO) DeleteWeightInfo(id int64) error {
	_, err := d.db.Exec("DELETE FROM WeightInfo WHERE id = ?", id)
	return err
}
