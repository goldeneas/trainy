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

func (s *RoutineService) RegisterRoutine(r *model.Routine) (int64, error) {
	return s.routineDAO.InsertRoutine(s.db, r)
}

func (s *RoutineService) RegisterRoutineInstance(r *model.RoutineInstance, infos []model.ActualSetInfo) (int64, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return 0, err
	}

	defer tx.Rollback()

	id, err := s.routineDAO.InsertRoutineInstance(tx, r)
	if err != nil {
		return 0, err
	}

	for _, info := range infos {
		info.RoutineInstanceID = id
		_, err = s.routineDAO.InsertActualSetInfo(tx, &info)

		if err != nil {
			return 0, err
		}
	}

	err = tx.Commit()
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (s *RoutineService) RegisterActualSetInfo(i *model.ActualSetInfo) (int64, error) {
	return s.routineDAO.InsertActualSetInfo(s.db, i)
}

func (s *RoutineService) GetRoutineByID(id int64) (*model.Routine, error) {
	return s.routineDAO.GetRoutineByID(s.db, id)
}

func (s *RoutineService) GetRoutineInstanceByID(id int64) (*model.RoutineInstance, error) {
	return s.routineDAO.GetRoutineInstanceByID(s.db, id)
}

func (s *RoutineService) GetActualSetInfoByID(id int64) (*model.ActualSetInfo, error) {
	return s.routineDAO.GetActualSetInfoByID(s.db, id)
}

func (s *RoutineService) GetAllActualSetInfoByRoutineInstanceID(id int64) ([]model.ActualSetInfo, error) {
	return s.routineDAO.GetAllActualSetInfoByRoutineInstanceID(s.db, id)
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
