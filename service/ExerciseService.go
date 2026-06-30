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

func (s *ExerciseService) RegisterPlannedExercise(e *model.PlannedExercise, infos []model.SetInfo) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}

	defer tx.Rollback()

	id, err := s.exerciseDAO.InsertPlannedExercise(s.db, e)
	if err != nil {
		return err
	}

	for _, info := range infos {
		info.ID = id
		_, err = s.exerciseDAO.InsertSetInfo(tx, &info)

		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (s *ExerciseService) GetExerciseByID(id int64) (*model.Exercise, error) {
	return s.exerciseDAO.GetExerciseByID(s.db, id)
}

func (s *ExerciseService) GetPlannedExerciseByID(id int64) (*model.PlannedExercise, error) {
	return s.exerciseDAO.GetPlannedExerciseByID(s.db, id)
}

func (s *ExerciseService) GetSetInfoByID(id int64) (*model.SetInfo, error) {
	return s.exerciseDAO.GetSetInfoByID(s.db, id)
}

func (s *ExerciseService) GetAllSetInfoByPlannedExerciseID(id int64) ([]model.SetInfo, error) {
}

func (s *ExerciseService) GetAllExercises() ([]model.Exercise, error) {
	return s.exerciseDAO.GetAllExercises(s.db)
}

func (s *ExerciseService) GetAllPlannedExercises() ([]model.PlannedExercise, error) {
	return s.exerciseDAO.GetAllPlannedExercises(s.db)
}

func (s *ExerciseService) DeleteExercise(id int64) error {
	return s.exerciseDAO.DeleteExercise(s.db, id)
}

func (s *ExerciseService) DeletePlannedExercise(id int64) error {
	return s.exerciseDAO.DeletePlannedExercise(s.db, id)
}
