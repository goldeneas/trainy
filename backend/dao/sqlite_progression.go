package dao

import (
	"database/sql"

	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type SQLiteProgressionDAO struct{}

func NewSQLiteProgressionDAO() *SQLiteProgressionDAO {
	return &SQLiteProgressionDAO{}
}

func (d *SQLiteProgressionDAO) InsertExerciseProgression(dbtx sqlw.DBTX, m *model.ExerciseProgression) (int64, error) {
	res, err := dbtx.Exec(`INSERT INTO ExerciseProgression (name, notes) VALUES (?, ?)`, m.Name, m.Notes)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteProgressionDAO) GetExerciseProgressionByID(dbtx sqlw.DBTX, id int64) (*model.ExerciseProgression, error) {
	var m model.ExerciseProgression
	row := dbtx.QueryRow(`SELECT id, name, notes FROM ExerciseProgression WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.Name, &m.Notes)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteProgressionDAO) GetAllExerciseProgressions(dbtx sqlw.DBTX) ([]model.ExerciseProgression, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.ExerciseProgression) error {
		return rows.Scan(&t.ID, &t.Name, &t.Notes)
	}, "SELECT id, name, notes FROM ExerciseProgression")
}

func (d *SQLiteProgressionDAO) UpdateExerciseProgressionByID(dbtx sqlw.DBTX, id int64, info *model.ExerciseProgression) error {
	_, err := dbtx.Exec(`UPDATE ExerciseProgression SET name = ?, notes = ? WHERE id = ?`, info.Name, info.Notes, id)
	return err
}

func (d *SQLiteProgressionDAO) DeleteExerciseProgressionByID(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM ExerciseProgression WHERE id = ?", id)
	return err
}

func (d *SQLiteProgressionDAO) InsertExerciseProgressionEntry(dbtx sqlw.DBTX, m *model.ExerciseProgressionEntry) (int64, error) {
	res, err := dbtx.Exec(`INSERT INTO ExerciseProgressionEntry (exercise_id, exercise_progression_id) VALUES (?, ?)`,
		m.ExerciseID, m.ExerciseProgressionID)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteProgressionDAO) GetExerciseProgressionEntryByID(dbtx sqlw.DBTX, id int64) (*model.ExerciseProgressionEntry, error) {
	var m model.ExerciseProgressionEntry
	row := dbtx.QueryRow(`SELECT id, exercise_id, exercise_progression_id FROM ExerciseProgressionEntry WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.ExerciseID, &m.ExerciseProgressionID)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteProgressionDAO) GetAllExerciseProgressionEntries(dbtx sqlw.DBTX) ([]model.ExerciseProgressionEntry, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.ExerciseProgressionEntry) error {
		return rows.Scan(&t.ID, &t.ExerciseID, &t.ExerciseProgressionID)
	}, "SELECT id, exercise_id, exercise_progression_id FROM ExerciseProgressionEntry")
}

func (d *SQLiteProgressionDAO) GetAllExerciseProgressionEntryIDsByExerciseProgressionID(dbtx sqlw.DBTX, progressionID int64) ([]int64, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *int64) error {
		return rows.Scan(t)
	}, "SELECT id FROM ExerciseProgressionEntry WHERE exercise_progression_id = ?", progressionID)
}

func (d *SQLiteProgressionDAO) UpdateExerciseProgressionEntryByID(dbtx sqlw.DBTX, id int64, info *model.ExerciseProgressionEntry) error {
	_, err := dbtx.Exec(`UPDATE ExerciseProgressionEntry SET exercise_id = ?, exercise_progression_id = ? WHERE id = ?`,
		info.ExerciseID, info.ExerciseProgressionID, id)
	return err
}

func (d *SQLiteProgressionDAO) DeleteExerciseProgressionEntryByID(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM ExerciseProgressionEntry WHERE id = ?", id)
	return err
}
