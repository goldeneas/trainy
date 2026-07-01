package dao

import (
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type RoutineDAO interface {
	InsertRoutine(dbtx sqlw.DBTX, r *model.Routine) (int64, error)
	InsertRoutineInstance(dbtx sqlw.DBTX, r *model.RoutineInstance) (int64, error)
	InsertActualSetInfo(dbtx sqlw.DBTX, i *model.ActualSetInfo) (int64, error)

	GetRoutineByID(dbtx sqlw.DBTX, id int64) (*model.Routine, error)
	GetRoutineInstanceByID(dbtx sqlw.DBTX, id int64) (*model.RoutineInstance, error)
	GetActualSetInfoByID(dbtx sqlw.DBTX, id int64) (*model.ActualSetInfo, error)

	GetAllActualSetInfoByRoutineInstanceID(dbtx sqlw.DBTX, id int64) ([]model.ActualSetInfo, error)
	GetAllRoutines(dbtx sqlw.DBTX) ([]model.Routine, error)
	GetAllRoutineInstances(dbtx sqlw.DBTX) ([]model.RoutineInstance, error)

	DeleteRoutine(dbtx sqlw.DBTX, id int64) error
	DeleteRoutineInstance(dbtx sqlw.DBTX, id int64) error
	DeleteActualSetInfo(dbtx sqlw.DBTX, id int64) error
}
