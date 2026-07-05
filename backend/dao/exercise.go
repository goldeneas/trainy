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

	GetRepUnitByID(dbtx sqlw.DBTX, id int64) (*model.RepUnit, error)
	GetExerciseByID(dbtx sqlw.DBTX, id int64) (*model.Exercise, error)
	GetPlannedExerciseByID(dbtx sqlw.DBTX, id int64) (*model.PlannedExercise, error)
	GetPlannedSetInfoByID(dbtx sqlw.DBTX, id int64) (*model.PlannedSetInfo, error)

	GetAllSetInfoByPlannedExerciseID(dbtx sqlw.DBTX, id int64) ([]model.PlannedSetInfo, error)
	GetAllExercises(dbtx sqlw.DBTX) ([]model.Exercise, error)
	GetAllPlannedExercises(dbtx sqlw.DBTX) ([]model.PlannedExercise, error)
	GetAllExerciseMuscleGroupIDs(dbtx sqlw.DBTX, exerciseID int64) ([]int64, error)
	GetAllRepUnits(dbtx sqlw.DBTX) ([]model.RepUnit, error)
	GetAllMuscleGroups(dbtx sqlw.DBTX) ([]model.MuscleGroup, error)

	DeleteExerciseByID(dbtx sqlw.DBTX, id int64) error
	DeletePlannedExerciseByID(dbtx sqlw.DBTX, id int64) error
	DeletePlannedSetInfoByID(dbtx sqlw.DBTX, id int64) error
	DeleteExerciseMuscleGroupByID(dbtx sqlw.DBTX, id int64) error
}
