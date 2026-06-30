package dao

import (
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type RoutineDAO interface {
	InsertRoutine(dbtx sqlw.DBTX, r *model.Routine) (int64, error)
	InsertRoutineInstance(dbtx sqlw.DBTX, r *model.RoutineInstance) (int64, error)
	InsertWeightInfo(dbtx sqlw.DBTX, i *model.WeightInfo) (int64, error)

	GetRoutineByID(dbtx sqlw.DBTX, id int64) (*model.Routine, error)
	GetRoutineInstanceByID(dbtx sqlw.DBTX, id int64) (*model.RoutineInstance, error)
	GetWeightInfoByID(dbtx sqlw.DBTX, id int64) (*model.WeightInfo, error)

	GetAllWeightInfoByRoutineInstanceID(dbtx sqlw.DBTX, id int64) ([]model.WeightInfo, error)
	GetAllRoutines(dbtx sqlw.DBTX) ([]model.Routine, error)
	GetAllRoutineInstances(dbtx sqlw.DBTX) ([]model.RoutineInstance, error)

	DeleteRoutine(dbtx sqlw.DBTX, id int64) error
	DeleteRoutineInstance(dbtx sqlw.DBTX, id int64) error
	DeleteWeightInfo(dbtx sqlw.DBTX, id int64) error
}
