package dao

import (
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type RoutineDAO interface {
	InsertRoutine(dbtx sqlw.DBTX, r *model.Routine) (int64, error)
	InsertActualRoutine(dbtx sqlw.DBTX, r *model.ActualRoutine) (int64, error)
	InsertActualSetInfo(dbtx sqlw.DBTX, i *model.ActualSetInfo) (int64, error)

	GetRoutineByID(dbtx sqlw.DBTX, id int64) (*model.Routine, error)
	GetActualRoutineByID(dbtx sqlw.DBTX, id int64) (*model.ActualRoutine, error)
	GetActualSetInfoByID(dbtx sqlw.DBTX, id int64) (*model.ActualSetInfo, error)

	GetAllActualSetInfoByActualRoutineID(dbtx sqlw.DBTX, id int64) ([]model.ActualSetInfo, error)
	GetAllRoutines(dbtx sqlw.DBTX) ([]model.Routine, error)
	GetAllActualRoutines(dbtx sqlw.DBTX) ([]model.ActualRoutine, error)

	DeleteRoutineByID(dbtx sqlw.DBTX, id int64) error
	UpdateRoutineByID(dbtx sqlw.DBTX, r *model.Routine) error
	DeleteActualRoutineByID(dbtx sqlw.DBTX, id int64) error
	DeleteActualSetInfoByID(dbtx sqlw.DBTX, id int64) error
}
