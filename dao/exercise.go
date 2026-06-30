package dao

import (
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type ExerciseDAO interface {
	InsertExercise(dbtx sqlw.DBTX, m *model.Exercise) (int64, error)
	InsertPlannedExercise(dbtx sqlw.DBTX, m *model.PlannedExercise) (int64, error)
	InsertSetInfo(dbtx sqlw.DBTX, m *model.SetInfo) (int64, error)

	GetExerciseByID(dbtx sqlw.DBTX, id int64) (*model.Exercise, error)
	GetPlannedExerciseByID(dbtx sqlw.DBTX, id int64) (*model.PlannedExercise, error)
	GetSetInfoByID(dbtx sqlw.DBTX, id int64) (*model.SetInfo, error)

	GetAllExercises(dbtx sqlw.DBTX) ([]model.Exercise, error)
	GetAllPlannedExercises(dbtx sqlw.DBTX) ([]model.PlannedExercise, error)

	DeleteExercise(dbtx sqlw.DBTX, id int64) error
	DeletePlannedExercise(dbtx sqlw.DBTX, id int64) error
	DeleteSetInfo(dbtx sqlw.DBTX, id int64) error
}
