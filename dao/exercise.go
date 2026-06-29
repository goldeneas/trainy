package dao

import "github.com/goldeneas/trainy/model"

type ExerciseDAO interface {
	InsertExercise(m *model.Exercise) (int64, error)
	InsertPlannedExercise(m *model.PlannedExercise) (int64, error)
	InsertSetInfo(m *model.SetInfo) (int64, error)

	GetExerciseByID(id int64) (*model.Exercise, error)
	GetPlannedExerciseByID(id int64) (*model.PlannedExercise, error)
	GetSetInfoByID(id int64) (*model.SetInfo, error)

	GetAllExercises() ([]model.Exercise, error)
	GetAllPlannedExercises() ([]model.PlannedExercise, error)

	DeleteExercise(id int64) error
	DeletePlannedExercise(id int64) error
	DeleteSetInfo(id int64) error
}
