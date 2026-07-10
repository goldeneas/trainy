package dao

import (
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type ProgressionDAO interface {
	InsertExerciseProgression(dbtx sqlw.DBTX, m *model.ExerciseProgression) (int64, error)
	GetExerciseProgressionByID(dbtx sqlw.DBTX, id int64) (*model.ExerciseProgression, error)
	GetAllExerciseProgressions(dbtx sqlw.DBTX) ([]model.ExerciseProgression, error)
	UpdateExerciseProgressionByID(dbtx sqlw.DBTX, id int64, info *model.ExerciseProgression) error
	DeleteExerciseProgressionByID(dbtx sqlw.DBTX, id int64) error

	InsertExerciseProgressionEntry(dbtx sqlw.DBTX, m *model.ExerciseProgressionEntry) (int64, error)
	GetExerciseProgressionEntryByID(dbtx sqlw.DBTX, id int64) (*model.ExerciseProgressionEntry, error)
	GetAllExerciseProgressionEntries(dbtx sqlw.DBTX) ([]model.ExerciseProgressionEntry, error)
	GetAllExerciseProgressionEntryIDsByExerciseProgressionID(dbtx sqlw.DBTX, progressionID int64) ([]int64, error)
	UpdateExerciseProgressionEntryByID(dbtx sqlw.DBTX, id int64, info *model.ExerciseProgressionEntry) error
	DeleteExerciseProgressionEntryByID(dbtx sqlw.DBTX, id int64) error
}
