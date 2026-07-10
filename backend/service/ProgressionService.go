package service

import (
	"database/sql"

	"github.com/goldeneas/trainy/dao"
	dto_response "github.com/goldeneas/trainy/dto/response"
	"github.com/goldeneas/trainy/model"
)

type ProgressionService struct {
	db             *sql.DB
	progressionDAO dao.ProgressionDAO
}

func NewProgressionService(db *sql.DB, progressionDAO dao.ProgressionDAO) *ProgressionService {
	return &ProgressionService{
		db:             db,
		progressionDAO: progressionDAO,
	}
}

func (s *ProgressionService) RegisterExerciseProgression(m *model.ExerciseProgression) (int64, error) {
	return s.progressionDAO.InsertExerciseProgression(s.db, m)
}

func (s *ProgressionService) GetExerciseProgressionByID(id int64) (*dto_response.ExerciseProgression, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}

	defer tx.Rollback()

	prog, err := s.progressionDAO.GetExerciseProgressionByID(tx, id)
	if err != nil {
		return nil, err
	}

	entryIDs, err := s.progressionDAO.GetAllExerciseProgressionEntryIDsByExerciseProgressionID(tx, id)
	if err != nil {
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		return nil, err
	}

	return &dto_response.ExerciseProgression{
		ID:       prog.ID,
		Name:     prog.Name,
		Notes:    prog.Notes,
		EntryIDs: entryIDs,
	}, nil
}

func (s *ProgressionService) GetAllExerciseProgressions() ([]dto_response.ExerciseProgression, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}

	defer tx.Rollback()

	progs, err := s.progressionDAO.GetAllExerciseProgressions(tx)
	if err != nil {
		return nil, err
	}

	res := make([]dto_response.ExerciseProgression, len(progs))
	for i, prog := range progs {
		entryIDs, err := s.progressionDAO.GetAllExerciseProgressionEntryIDsByExerciseProgressionID(tx, prog.ID)
		if err != nil {
			return nil, err
		}

		res[i] = dto_response.ExerciseProgression{
			ID:       prog.ID,
			Name:     prog.Name,
			Notes:    prog.Notes,
			EntryIDs: entryIDs,
		}
	}

	err = tx.Commit()
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (s *ProgressionService) UpdateExerciseProgressionByID(id int64, info *model.ExerciseProgression) error {
	return s.progressionDAO.UpdateExerciseProgressionByID(s.db, id, info)
}

func (s *ProgressionService) DeleteExerciseProgressionByID(id int64) error {
	return s.progressionDAO.DeleteExerciseProgressionByID(s.db, id)
}

func (s *ProgressionService) RegisterExerciseProgressionEntry(m *model.ExerciseProgressionEntry) (int64, error) {
	return s.progressionDAO.InsertExerciseProgressionEntry(s.db, m)
}

func (s *ProgressionService) GetExerciseProgressionEntryByID(id int64) (*model.ExerciseProgressionEntry, error) {
	return s.progressionDAO.GetExerciseProgressionEntryByID(s.db, id)
}

func (s *ProgressionService) GetAllExerciseProgressionEntries() ([]model.ExerciseProgressionEntry, error) {
	return s.progressionDAO.GetAllExerciseProgressionEntries(s.db)
}

func (s *ProgressionService) UpdateExerciseProgressionEntryByID(id int64, info *model.ExerciseProgressionEntry) error {
	return s.progressionDAO.UpdateExerciseProgressionEntryByID(s.db, id, info)
}

func (s *ProgressionService) DeleteExerciseProgressionEntryByID(id int64) error {
	return s.progressionDAO.DeleteExerciseProgressionEntryByID(s.db, id)
}
