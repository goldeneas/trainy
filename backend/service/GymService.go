package service

import (
	"database/sql"

	"github.com/goldeneas/trainy/dao"
	"github.com/goldeneas/trainy/model"
)

type GymService struct {
	db     *sql.DB
	gymDAO dao.GymDAO
}

func NewGymService(db *sql.DB, gymDAO dao.GymDAO) *GymService {
	return &GymService{
		db:     db,
		gymDAO: gymDAO,
	}
}

func (s *GymService) RegisterGymLocation(m *model.GymLocation) (int64, error) {
	return s.gymDAO.InsertGymLocation(s.db, m)
}

func (s *GymService) GetGymLocationByID(id int64) (*model.GymLocation, error) {
	return s.gymDAO.GetGymLocationByID(s.db, id)
}

func (s *GymService) GetAllGymLocations() ([]model.GymLocation, error) {
	return s.gymDAO.GetAllGymLocations(s.db)
}

func (s *GymService) UpdateGymLocationByID(id int64, info *model.GymLocation) error {
	return s.gymDAO.UpdateGymLocationByID(s.db, id, info)
}

func (s *GymService) DeleteGymLocationByID(id int64) error {
	return s.gymDAO.DeleteGymLocationByID(s.db, id)
}

func (s *GymService) GetGymEquipmentByID(id int64) (*model.GymEquipment, error) {
	return s.gymDAO.GetGymEquipmentByID(s.db, id)
}

func (s *GymService) GetAllGymEquipment() ([]model.GymEquipment, error) {
	return s.gymDAO.GetAllGymEquipment(s.db)
}

func (s *GymService) RegisterGymLocationEquipment(m *model.GymLocationEquipment) (int64, error) {
	return s.gymDAO.InsertGymLocationEquipment(s.db, m)
}

func (s *GymService) GetGymLocationEquipmentByID(id int64) (*model.GymLocationEquipment, error) {
	return s.gymDAO.GetGymLocationEquipmentByID(s.db, id)
}

func (s *GymService) GetAllGymLocationEquipment() ([]model.GymLocationEquipment, error) {
	return s.gymDAO.GetAllGymLocationEquipment(s.db)
}

func (s *GymService) DeleteGymLocationEquipmentByID(id int64) error {
	return s.gymDAO.DeleteGymLocationEquipmentByID(s.db, id)
}
