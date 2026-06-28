package dao

import "github.com/goldeneas/trainy/model"

type ExerciseDAO interface {
	InsertExercise(m *model.Exercise) (int64, error)
	InsertExerciseInstance(m *model.ExerciseInstance) (int64, error)
	InsertSetInfo(m *model.SetInfo) (int64, error)

	GetExerciseByID(id int64) (*model.Exercise, error)
	GetExerciseInstanceByID(id int64) (*model.ExerciseInstance, error)
	GetSetInfoByID(id int64) (*model.SetInfo, error)

	GetAllExercises() ([]model.Exercise, error)
	GetAllExerciseInstances() ([]model.ExerciseInstance, error)

	DeleteExercise(id int64) error
	DeleteExerciseInstance(id int64) error
	DeleteSetInfo(id int64) error
}
