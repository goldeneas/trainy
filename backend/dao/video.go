package dao

import (
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type VideoDAO interface {
	InsertVideo(dbtx sqlw.DBTX, m *model.Video) (int64, error)
	GetVideoByID(dbtx sqlw.DBTX, id int64) (*model.Video, error)
	GetVideoByLink(dbtx sqlw.DBTX, link string) (*model.Video, error)
	UpdateVideo(dbtx sqlw.DBTX, m *model.Video) error
	DeleteVideoByID(dbtx sqlw.DBTX, id int64) error
}
