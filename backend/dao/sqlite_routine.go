package dao

import (
	"database/sql"

	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type SQLiteRoutineDAO struct{}

func NewSQLiteRoutineDAO() *SQLiteRoutineDAO {
	return &SQLiteRoutineDAO{}
}

func (d *SQLiteRoutineDAO) InsertRoutine(dbtx sqlw.DBTX, m *model.Routine) (int64, error) {
	res, err := dbtx.Exec("INSERT INTO Routine(name, description, image_id) VALUES (?, ?, ?)",
		m.Name, m.Description, m.ImageID)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteRoutineDAO) InsertActualRoutine(dbtx sqlw.DBTX, m *model.ActualRoutine) (int64, error) {
	res, err := dbtx.Exec("INSERT INTO ActualRoutine (start_timestamp, finish_timestamp, routine_id) VALUES (?, ?, ?)",
		m.StartTimestamp, m.FinishTimestamp, m.RoutineID)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteRoutineDAO) InsertActualSetInfo(dbtx sqlw.DBTX, i *model.ActualSetInfo) (int64, error) {
	res, err := dbtx.Exec("INSERT INTO ActualSetInfo (weight, actual_routine_id, set_info_id, actual_reps) VALUES (?, ?, ?, ?)",
		i.Weight, i.ActualRoutineID, i.PlannedSetInfoID, i.ActualReps)

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

func (d *SQLiteRoutineDAO) GetActualRoutineByID(dbtx sqlw.DBTX, id int64) (*model.ActualRoutine, error) {
	var m model.ActualRoutine

	row := dbtx.QueryRow("SELECT id, start_timestamp, finish_timestamp, routine_id FROM ActualRoutine WHERE id = ?", id)
	err := row.Scan(&m.ID, &m.StartTimestamp, &m.FinishTimestamp, &m.RoutineID)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteRoutineDAO) GetActualSetInfoByID(dbtx sqlw.DBTX, id int64) (*model.ActualSetInfo, error) {
	var m model.ActualSetInfo
	row := dbtx.QueryRow(`SELECT id, weight, actual_routine_id, set_info_id, actual_reps FROM ActualSetInfo WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.Weight, &m.ActualRoutineID, &m.PlannedSetInfoID, &m.ActualReps)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteRoutineDAO) GetAllActualSetInfoByActualRoutineID(dbtx sqlw.DBTX, id int64) ([]model.ActualSetInfo, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.ActualSetInfo) error {
		return rows.Scan(&t.ID, &t.Weight, &t.ActualRoutineID, &t.PlannedSetInfoID, &t.ActualReps)
	}, `SELECT id, weight, actual_routine_id, set_info_id, actual_reps
		FROM ActualSetInfo
		WHERE actual_routine_id = ?`, id)
}

func (d *SQLiteRoutineDAO) GetAllRoutines(dbtx sqlw.DBTX) ([]model.Routine, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.Routine) error {
		return rows.Scan(&t.ID, &t.Name, &t.Description, &t.ImageID)
	}, "SELECT id, name, description, image_id FROM Routine")
}

func (d *SQLiteRoutineDAO) GetAllActualRoutines(dbtx sqlw.DBTX) ([]model.ActualRoutine, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.ActualRoutine) error {
		return rows.Scan(&t.ID, &t.StartTimestamp, &t.FinishTimestamp, &t.RoutineID)
	}, "SELECT id, start_timestamp, finish_timestamp, routine_id FROM ActualRoutine")
}

func (d *SQLiteRoutineDAO) DeleteRoutineByID(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM Routine WHERE id = ?", id)
	return err
}

func (d *SQLiteRoutineDAO) UpdateRoutineByID(dbtx sqlw.DBTX, m *model.Routine) error {
	_, err := dbtx.Exec("UPDATE Routine SET name = ?, description = ?, image_id = ? WHERE id = ?",
		m.Name, m.Description, m.ImageID, m.ID)
	return err
}

func (d *SQLiteRoutineDAO) DeleteActualRoutineByID(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM ActualRoutine WHERE id = ?", id)
	return err
}

func (d *SQLiteRoutineDAO) DeleteActualSetInfoByID(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM ActualSetInfo WHERE id = ?", id)
	return err
}
