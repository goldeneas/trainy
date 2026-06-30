package service

import (
	"database/sql"

	"github.com/goldeneas/trainy/dao"
	"github.com/goldeneas/trainy/model"
)

type RoutineService struct {
	db         *sql.DB
	routineDAO dao.RoutineDAO
}

func NewRoutineService(db *sql.DB, routineDAO dao.RoutineDAO) *RoutineService {
	return &RoutineService{
		db:         db,
		routineDAO: routineDAO,
	}
}

func (s *RoutineService) RegisterRoutine(r *model.Routine) error {
	_, err := s.routineDAO.InsertRoutine(s.db, r)
	return err
}

func (s *RoutineService) RegisterRoutineInstance(r *model.RoutineInstance, infos []model.WeightInfo) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}

	defer tx.Rollback()

	id, err := s.routineDAO.InsertRoutineInstance(tx, r)
	if err != nil {
		return err
	}

	for _, info := range infos {
		info.ID = id
		_, err = s.routineDAO.InsertWeightInfo(tx, &info)

		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (s *RoutineService) RegisterWeightInfo(i *model.WeightInfo) error {
	_, err := s.routineDAO.InsertWeightInfo(s.db, i)
	return err
}

func (s *RoutineService) GetRoutineByID(id int64) (*model.Routine, error) {
	return s.routineDAO.GetRoutineByID(s.db, id)
}

func (s *RoutineService) GetRoutineInstanceByID(id int64) (*model.RoutineInstance, error) {
	return s.routineDAO.GetRoutineInstanceByID(s.db, id)
}

func (s *RoutineService) GetWeightInfoByID(id int64) (*model.WeightInfo, error) {
	return s.routineDAO.GetWeightInfoByID(s.db, id)
}

func (s *RoutineService) GetAllWeightInfoByRoutineInstanceID(id int64) ([]model.WeightInfo, error) {
}

func (s *RoutineService) GetAllRoutines() ([]model.Routine, error) {
	return s.routineDAO.GetAllRoutines(s.db)
}

func (s *RoutineService) GetAllRoutineInstances() ([]model.RoutineInstance, error) {
	return s.routineDAO.GetAllRoutineInstances(s.db)
}

func (s *RoutineService) DeleteRoutine(id int64) error {
	return s.routineDAO.DeleteRoutine(s.db, id)
}

func (s *RoutineService) DeleteRoutineInstance(id int64) error {
	return s.routineDAO.DeleteRoutineInstance(s.db, id)
}
