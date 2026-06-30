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
