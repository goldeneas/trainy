package service

import (
	"database/sql"

	"github.com/goldeneas/trainy/dao"
	"github.com/goldeneas/trainy/model"
)

type ExerciseService struct {
	db          *sql.DB
	exerciseDAO dao.ExerciseDAO
}

func NewExerciseService(db *sql.DB, routineDAO dao.RoutineDAO) *RoutineService {
	return &RoutineService{
		db:         db,
		routineDAO: routineDAO,
	}
}

func (s *ExerciseService) RegisterExercise(e *model.Exercise) error {
	_, err := s.exerciseDAO.InsertExercise(s.db, e)
	return err
}

func (s *ExerciseService) RegisterPlannedExercise(e *model.PlannedExercise) error {
	_, err := s.exerciseDAO.InsertPlannedExercise(s.db, e)
	return err
}
