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

func (s *RoutineService) RegisterActualRoutine(r *model.ActualRoutine, infos []model.ActualSetInfo) (int64, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return 0, err
	}

	defer tx.Rollback()

	id, err := s.routineDAO.InsertActualRoutine(tx, r)
	if err != nil {
		return 0, err
	}

	for _, info := range infos {
		info.ActualRoutineID = id
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

func (s *RoutineService) GetActualRoutineByID(id int64) (*model.ActualRoutine, error) {
	return s.routineDAO.GetActualRoutineByID(s.db, id)
}

func (s *RoutineService) GetActualSetInfoByID(id int64) (*model.ActualSetInfo, error) {
	return s.routineDAO.GetActualSetInfoByID(s.db, id)
}

func (s *RoutineService) GetAllActualSetInfoByActualRoutineID(id int64) ([]model.ActualSetInfo, error) {
	return s.routineDAO.GetAllActualSetInfoByActualRoutineID(s.db, id)
}

func (s *RoutineService) GetAllRoutines() ([]model.Routine, error) {
	return s.routineDAO.GetAllRoutines(s.db)
}

func (s *RoutineService) GetAllActualRoutines() ([]model.ActualRoutine, error) {
	return s.routineDAO.GetAllActualRoutines(s.db)
}

func (s *RoutineService) DeleteRoutineByID(id int64) error {
	return s.routineDAO.DeleteRoutineByID(s.db, id)
}

func (s *RoutineService) UpdateRoutineByID(r *model.Routine) error {
	return s.routineDAO.UpdateRoutineByID(s.db, r)
}

func (s *RoutineService) DeleteActualRoutineByID(id int64) error {
	return s.routineDAO.DeleteActualRoutineByID(s.db, id)
}
