package service

import (
	"database/sql"

	"github.com/goldeneas/trainy/dao"
	dto_response "github.com/goldeneas/trainy/dto/response"
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

func (s *ExerciseService) RegisterExercise(e *model.Exercise, muscleGroups []int64) (int64, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return 0, err
	}

	defer tx.Rollback()

	id, err := s.exerciseDAO.InsertExercise(tx, e)
	if err != nil {
		return 0, err
	}

	for _, groupID := range muscleGroups {
		group := model.ExerciseMuscleGroup{
			ExerciseID:    id,
			MuscleGroupID: groupID,
		}

		s.exerciseDAO.InsertExerciseMuscleGroup(tx, &group)
	}

	err = tx.Commit()
	if err != nil {
		return 0, err
	}

	return id, nil
}

func (s *ExerciseService) RegisterPlannedExercise(e *model.PlannedExercise, infos []model.PlannedSetInfo) (int64, error) {
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
		_, err = s.exerciseDAO.InsertPlannedSetInfo(tx, &info)

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

func (s *ExerciseService) GetExerciseByID(id int64) (*dto_response.Exercise, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}

	defer tx.Rollback()

	exercise, err := s.exerciseDAO.GetExerciseByID(tx, id)
	if err != nil {
		return nil, err
	}

	muscleGroupIDs, err := s.exerciseDAO.GetAllExerciseMuscleGroupIDs(tx, id)
	if err != nil {
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		return nil, err
	}

	return &dto_response.Exercise{
		ID:             id,
		Name:           exercise.Name,
		Notes:          exercise.Notes,
		Instructions:   exercise.Instructions,
		ImageID:        exercise.ImageID,
		RepUnitID:      exercise.RepUnitID,
		MuscleGroupIDs: muscleGroupIDs,
	}, nil
}

func (s *ExerciseService) GetPlannedExerciseByID(id int64) (*model.PlannedExercise, error) {
	return s.exerciseDAO.GetPlannedExerciseByID(s.db, id)
}

func (s *ExerciseService) GetRepUnitByID(id int64) (*model.RepUnit, error) {
	return s.exerciseDAO.GetRepUnitByID(s.db, id)
}

func (s *ExerciseService) GetSetInfoByID(id int64) (*model.PlannedSetInfo, error) {
	return s.exerciseDAO.GetPlannedSetInfoByID(s.db, id)
}

func (s *ExerciseService) UpdateExerciseByID(id int64, info *model.Exercise, muscleGroups []int64) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}

	defer tx.Rollback()

	err = s.exerciseDAO.UpdateExerciseByID(tx, id, info)
	if err != nil {
		return err
	}

	err = s.exerciseDAO.DeleteExerciseMuscleGroupsByExerciseID(tx, id)
	if err != nil {
		return err
	}

	for _, groupID := range muscleGroups {
		group := model.ExerciseMuscleGroup{
			ExerciseID:    id,
			MuscleGroupID: groupID,
		}

		_, err = s.exerciseDAO.InsertExerciseMuscleGroup(tx, &group)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (s *ExerciseService) GetAllSetInfoByPlannedExerciseID(id int64) ([]model.PlannedSetInfo, error) {
	return s.exerciseDAO.GetAllSetInfoByPlannedExerciseID(s.db, id)
}

func (s *ExerciseService) GetAllExercises() ([]dto_response.Exercise, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}

	defer tx.Rollback()

	exs, err := s.exerciseDAO.GetAllExercises(tx)
	if err != nil {
		return nil, err
	}

	exercises := make([]dto_response.Exercise, 0, len(exs))
	for _, exercise := range exs {
		muscleGroupIDs, err := s.exerciseDAO.GetAllExerciseMuscleGroupIDs(tx, exercise.ID)
		if err != nil {
			return nil, err
		}

		exercises = append(exercises, dto_response.Exercise{
			ID:             exercise.ID,
			Name:           exercise.Name,
			Notes:          exercise.Notes,
			Instructions:   exercise.Instructions,
			ImageID:        exercise.ImageID,
			RepUnitID:      exercise.RepUnitID,
			MuscleGroupIDs: muscleGroupIDs,
		})
	}

	return exercises, nil
}

func (s *ExerciseService) GetAllPlannedExercises() ([]model.PlannedExercise, error) {
	return s.exerciseDAO.GetAllPlannedExercises(s.db)
}

func (s *ExerciseService) DeleteExerciseByID(id int64) error {
	return s.exerciseDAO.DeleteExerciseByID(s.db, id)
}

func (s *ExerciseService) DeletePlannedExerciseByID(id int64) error {
	return s.exerciseDAO.DeletePlannedExerciseByID(s.db, id)
}

func (s *ExerciseService) GetAllRepUnits() ([]model.RepUnit, error) {
	return s.exerciseDAO.GetAllRepUnits(s.db)
}

func (s *ExerciseService) GetAllMuscleGroups() ([]model.MuscleGroup, error) {
	return s.exerciseDAO.GetAllMuscleGroups(s.db)
}
