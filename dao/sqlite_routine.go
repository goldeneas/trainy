package dao

import (
	"database/sql"

	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type SQLiteRoutineDAO struct{}

func NewSQLiteRoutineDAO(db *sql.DB) *SQLiteRoutineDAO {
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

func (d *SQLiteRoutineDAO) InsertRoutineInstance(dbtx sqlw.DBTX, m *model.RoutineInstance) (int64, error) {
	res, err := dbtx.Exec("INSERT INTO RoutineInstance (finish_timestamp, routine_id) VALUES (?, ?)",
		m.FinishTimestamp, m.RoutineID)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteRoutineDAO) InsertActualSetInfo(dbtx sqlw.DBTX, i *model.ActualSetInfo) (int64, error) {
	res, err := dbtx.Exec("INSERT INTO ActualSetInfo (weight, routine_inst_id, set_info_id, actual_reps) VALUES (?, ?, ?, ?)",
		i.Weight, i.RoutineInstanceID, i.PlannedSetInfoID, i.ActualReps)

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

func (d *SQLiteRoutineDAO) GetActualSetInfoByID(dbtx sqlw.DBTX, id int64) (*model.ActualSetInfo, error) {
	var m model.ActualSetInfo
	row := dbtx.QueryRow(`SELECT id, weight, routine_inst_id, set_info_id FROM ActualSetInfo WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.Weight, &m.RoutineInstanceID, &m.PlannedSetInfoID)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteRoutineDAO) GetAllActualSetInfoByRoutineInstanceID(dbtx sqlw.DBTX, id int64) ([]model.ActualSetInfo, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.ActualSetInfo) error {
		return rows.Scan(t.ID, t.Weight, t.RoutineInstanceID, t.PlannedSetInfoID)
	}, `SELECT id, weight, routine_inst_id, set_info_id
		FROM RoutineInstance
		WHERE routine_inst_id = ?`, id)
}

func (d *SQLiteRoutineDAO) GetAllRoutines(dbtx sqlw.DBTX) ([]model.Routine, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.Routine) error {
		return rows.Scan(t.ID, t.Name, t.Description, t.ImageID)
	}, "SELECT id, name, description, image_id FROM Routine")
}

func (d *SQLiteRoutineDAO) GetAllRoutineInstances(dbtx sqlw.DBTX) ([]model.RoutineInstance, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.RoutineInstance) error {
		return rows.Scan(t.ID, t.FinishTimestamp, t.RoutineID)
	}, "SELECT id, finish_timestamp, routine_id FROM RoutineInstance")
}

func (d *SQLiteRoutineDAO) DeleteRoutine(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM Routine WHERE id = ?", id)
	return err
}

func (d *SQLiteRoutineDAO) DeleteRoutineInstance(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM RoutineInstance WHERE id = ?", id)
	return err
}

func (d *SQLiteRoutineDAO) DeleteActualSetInfo(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM ActualSetInfo WHERE id = ?", id)
	return err
}
