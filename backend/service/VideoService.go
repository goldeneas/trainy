package service

import (
	"database/sql"

	"github.com/goldeneas/trainy/dao"
	"github.com/goldeneas/trainy/model"
)

type VideoService struct {
	db       *sql.DB
	videoDAO dao.VideoDAO
}

func NewVideoService(db *sql.DB, videoDAO dao.VideoDAO) *VideoService {
	return &VideoService{
		db:       db,
		videoDAO: videoDAO,
	}
}

func (s *VideoService) RegisterVideo(v *model.Video) (int64, error) {
	existing, err := s.videoDAO.GetVideoByLink(s.db, v.Link)
	if err == nil {
		return existing.ID, nil
	}

	if err != sql.ErrNoRows {
		return 0, err
	}

	return s.videoDAO.InsertVideo(s.db, v)
}

func (s *VideoService) GetVideoByID(id int64) (*model.Video, error) {
	return s.videoDAO.GetVideoByID(s.db, id)
}
