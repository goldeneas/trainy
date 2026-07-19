package dao

import (
	"database/sql"

	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type SQLiteGymDAO struct{}

func NewSQLiteGymDAO() *SQLiteGymDAO {
	return &SQLiteGymDAO{}
}

func (d *SQLiteGymDAO) InsertGymLocation(dbtx sqlw.DBTX, m *model.GymLocation) (int64, error) {
	res, err := dbtx.Exec(`INSERT INTO GymLocation (name, latitude, longitude, rating) VALUES (?, ?, ?, ?)`,
		m.Name, m.Latitude, m.Longitude, m.Rating)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteGymDAO) GetGymLocationByID(dbtx sqlw.DBTX, id int64) (*model.GymLocation, error) {
	var m model.GymLocation
	row := dbtx.QueryRow(`SELECT id, name, latitude, longitude, rating FROM GymLocation WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.Name, &m.Latitude, &m.Longitude, &m.Rating)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteGymDAO) GetAllGymLocations(dbtx sqlw.DBTX) ([]model.GymLocation, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.GymLocation) error {
		return rows.Scan(&t.ID, &t.Name, &t.Latitude, &t.Longitude, &t.Rating)
	}, "SELECT id, name, latitude, longitude, rating FROM GymLocation")
}

func (d *SQLiteGymDAO) UpdateGymLocationByID(dbtx sqlw.DBTX, id int64, info *model.GymLocation) error {
	_, err := dbtx.Exec(`UPDATE GymLocation SET name = ?, latitude = ?, longitude = ?, rating = ? WHERE id = ?`,
		info.Name, info.Latitude, info.Longitude, info.Rating, id)
	return err
}

func (d *SQLiteGymDAO) DeleteGymLocationByID(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM GymLocation WHERE id = ?", id)
	return err
}

func (d *SQLiteGymDAO) GetGymEquipmentByID(dbtx sqlw.DBTX, id int64) (*model.GymEquipment, error) {
	var m model.GymEquipment
	row := dbtx.QueryRow(`SELECT id, name FROM GymEquipment WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.Name)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteGymDAO) GetAllGymEquipment(dbtx sqlw.DBTX) ([]model.GymEquipment, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.GymEquipment) error {
		return rows.Scan(&t.ID, &t.Name)
	}, "SELECT id, name FROM GymEquipment")
}

func (d *SQLiteGymDAO) InsertGymLocationEquipment(dbtx sqlw.DBTX, m *model.GymLocationEquipment) (int64, error) {
	res, err := dbtx.Exec(`INSERT INTO GymLocationEquipment (gym_location_id, gym_equipment_id) VALUES (?, ?)`,
		m.GymLocationID, m.GymEquipmentID)

	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteGymDAO) GetGymLocationEquipmentByID(dbtx sqlw.DBTX, id int64) (*model.GymLocationEquipment, error) {
	var m model.GymLocationEquipment
	row := dbtx.QueryRow(`SELECT id, gym_location_id, gym_equipment_id FROM GymLocationEquipment WHERE id = ?`, id)
	err := row.Scan(&m.ID, &m.GymLocationID, &m.GymEquipmentID)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteGymDAO) GetAllGymLocationEquipment(dbtx sqlw.DBTX) ([]model.GymLocationEquipment, error) {
	return sqlw.QueryAll(dbtx, func(rows *sql.Rows, t *model.GymLocationEquipment) error {
		return rows.Scan(&t.ID, &t.GymLocationID, &t.GymEquipmentID)
	}, "SELECT id, gym_location_id, gym_equipment_id FROM GymLocationEquipment")
}

func (d *SQLiteGymDAO) DeleteGymLocationEquipmentByID(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM GymLocationEquipment WHERE id = ?", id)
	return err
}
