package dao

import "github.com/goldeneas/trainy/model"

type RoutineDAO interface {
	InsertRoutine(m *model.Routine) (int64, error)
	RegisterRoutineInstance(r *model.RoutineInstance, i []model.WeightInfo) (int64, error)

	GetRoutineByID(id int64) (*model.Routine, error)
	GetRoutineInstanceByID(id int64) (*model.RoutineInstance, error)
	GetWeightInfoByID(id int64) (*model.WeightInfo, error)

	GetAllRoutines() ([]model.Routine, error)
	GetAllRoutineInstances() ([]model.RoutineInstance, error)

	DeleteRoutine(id int64) error
	DeleteRoutineInstance(id int64) error
	DeleteWeightInfo(id int64) error
}
