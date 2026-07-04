package dao

import (
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type ExerciseDAO interface {
	InsertExercise(dbtx sqlw.DBTX, m *model.Exercise) (int64, error)
	InsertPlannedExercise(dbtx sqlw.DBTX, m *model.PlannedExercise) (int64, error)
	InsertPlannedSetInfo(dbtx sqlw.DBTX, m *model.PlannedSetInfo) (int64, error)
	InsertExerciseMuscleGroup(dbtx sqlw.DBTX, m *model.ExerciseMuscleGroup) (int64, error)

	GetExerciseByID(dbtx sqlw.DBTX, id int64) (*model.Exercise, error)
	GetPlannedExerciseByID(dbtx sqlw.DBTX, id int64) (*model.PlannedExercise, error)
	GetSetInfoByID(dbtx sqlw.DBTX, id int64) (*model.PlannedSetInfo, error)

	GetAllSetInfoByPlannedExerciseID(dbtx sqlw.DBTX, id int64) ([]model.PlannedSetInfo, error)
	GetAllExercises(dbtx sqlw.DBTX) ([]model.Exercise, error)
	GetAllPlannedExercises(dbtx sqlw.DBTX) ([]model.PlannedExercise, error)
	GetAllExerciseMuscleGroupIDs(dbtx sqlw.DBTX, exerciseID int64) ([]int64, error)

	DeleteExercise(dbtx sqlw.DBTX, id int64) error
	DeletePlannedExercise(dbtx sqlw.DBTX, id int64) error
	DeletePlannedSetInfo(dbtx sqlw.DBTX, id int64) error
	DeleteExerciseMuscleGroup(dbtx sqlw.DBTX, id int64) error
}
