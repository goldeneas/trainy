package dao

import (
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type SQLiteRoutineDAO struct{}

func (d *SQLiteRoutineDAO) InsertRoutine(dbtx sqlw.DBTX, m *model.Routine) (int64, error) {
	res, err := dbtx.Exec("INSERT INTO Routine(name, description, image_id) VALUES (?, ?, ?)",
		m.Name, m.Description, m.ImageID)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteRoutineDAO) InsertRoutineInstance(dbtx sqlw.DBTX, m *model.RoutineInstance) (int64, error) {
	res, err := dbtx.Exec("INSERT INTO RoutineInstance (finish_timestamp, routine_id) VALUES (?, ?)",
		m.FinishTimestamp, m.RoutineID)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteRoutineDAO) InsertWeightInfo(dbtx sqlw.DBTX, i *model.WeightInfo) (int64, error) {
	res, err := dbtx.Exec("INSERT INTO WeightInfo (weight, routine_inst_id, set_info_id) VALUES (?, ?, ?)",
		i.Weight, i.RoutineInstanceID, i.SetInfoID)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteRoutineDAO) GetRoutineByID(dbtx sqlw.DBTX, id int64) (*model.Routine, error) {
	var m model.Routine

	row := dbtx.QueryRow("SELECT id, name, description, image_id FROM Routine WHERE id = ?", id)
	err := row.Scan(&m.ID, &m.Name, &m.Description, &m.ImageID)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteRoutineDAO) GetRoutineInstanceByID(dbtx sqlw.DBTX, id int64) (*model.RoutineInstance, error) {
	var m model.RoutineInstance

	row := dbtx.QueryRow("SELECT id, finish_timestamp, routine_id FROM RoutineInstance WHERE id = ?", id)
	err := row.Scan(&m.ID, &m.FinishTimestamp, &m.RoutineID)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteRoutineDAO) GetWeightInfoByID(dbtx sqlw.DBTX, id int64) (*model.WeightInfo, error) {
	var m model.WeightInfo
	row := dbtx.QueryRow(`SELECT id, weight, routine_inst_id, set_info_id FROM WeightInfo WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.Weight, &m.RoutineInstanceID, &m.SetInfoID)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteRoutineDAO) GetAllRoutines(dbtx sqlw.DBTX) ([]model.Routine, error) {
	rows, err := dbtx.Query("SELECT id, name, description, image_id FROM Routine")
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

func (d *SQLiteRoutineDAO) GetAllRoutineInstances(dbtx sqlw.DBTX) ([]model.RoutineInstance, error) {
	rows, err := dbtx.Query("SELECT id, finish_timestamp, routine_id FROM RoutineInstance")
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

func (d *SQLiteRoutineDAO) DeleteRoutine(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM Routine WHERE id = ?", id)
	return err
}

func (d *SQLiteRoutineDAO) DeleteRoutineInstance(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM RoutineInstance WHERE id = ?", id)
	return err
}

func (d *SQLiteRoutineDAO) DeleteWeightInfo(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM WeightInfo WHERE id = ?", id)
	return err
}
