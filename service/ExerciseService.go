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

func NewExerciseService(db *sql.DB, exerciseDAO dao.ExerciseDAO) *ExerciseService {
	return &ExerciseService{
		db:          db,
		exerciseDAO: exerciseDAO,
	}
}

func (s *ExerciseService) RegisterExercise(e *model.Exercise) (int64, error) {
	return s.exerciseDAO.InsertExercise(s.db, e)
}

func (s *ExerciseService) RegisterPlannedExercise(e *model.PlannedExercise, infos []model.SetInfo) (int64, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return 0, err
	}

	defer tx.Rollback()

	id, err := s.exerciseDAO.InsertPlannedExercise(tx, e)
	if err != nil {
		return 0, err
	}

	for _, info := range infos {
		info.PlannedExerciseID = id
		_, err = s.exerciseDAO.InsertSetInfo(tx, &info)

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
	return s.exerciseDAO.GetAllSetInfoByPlannedExerciseID(s.db, id)
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
