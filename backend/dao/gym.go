package dao

import (
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type GymDAO interface {
	InsertGymLocation(dbtx sqlw.DBTX, m *model.GymLocation) (int64, error)
	InsertGymLocationEquipment(dbtx sqlw.DBTX, m *model.GymLocationEquipment) (int64, error)

	GetGymLocationByID(dbtx sqlw.DBTX, id int64) (*model.GymLocation, error)
	GetAllGymLocations(dbtx sqlw.DBTX) ([]model.GymLocation, error)
	GetGymEquipmentByID(dbtx sqlw.DBTX, id int64) (*model.GymEquipment, error)
	GetAllGymEquipment(dbtx sqlw.DBTX) ([]model.GymEquipment, error)
	GetGymLocationEquipmentByID(dbtx sqlw.DBTX, id int64) (*model.GymLocationEquipment, error)
	GetAllGymLocationEquipment(dbtx sqlw.DBTX) ([]model.GymLocationEquipment, error)

	UpdateGymLocationByID(dbtx sqlw.DBTX, id int64, info *model.GymLocation) error

	DeleteGymLocationByID(dbtx sqlw.DBTX, id int64) error
	DeleteGymLocationEquipmentByID(dbtx sqlw.DBTX, id int64) error
}
