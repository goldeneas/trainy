package dao

import (
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/sqlw"
)

type SQLiteVideoDAO struct{}

func NewSQLiteVideoDAO() *SQLiteVideoDAO {
	return &SQLiteVideoDAO{}
}

func (d *SQLiteVideoDAO) InsertVideo(dbtx sqlw.DBTX, m *model.Video) (int64, error) {
	res, err := dbtx.Exec("INSERT INTO Video(link) VALUES (?)", m.Link)
	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (d *SQLiteVideoDAO) GetVideoByID(dbtx sqlw.DBTX, id int64) (*model.Video, error) {
	var m model.Video
	row := dbtx.QueryRow("SELECT id, link FROM Video WHERE id = ?", id)
	err := row.Scan(&m.ID, &m.Link)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteVideoDAO) UpdateVideo(dbtx sqlw.DBTX, m *model.Video) error {
	_, err := dbtx.Exec("UPDATE Video SET link = ? WHERE id = ?", m.Link, m.ID)
	return err
}

func (d *SQLiteVideoDAO) GetVideoByLink(dbtx sqlw.DBTX, link string) (*model.Video, error) {
	var m model.Video
	row := dbtx.QueryRow("SELECT id, link FROM Video WHERE link = ?", link)
	err := row.Scan(&m.ID, &m.Link)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (d *SQLiteVideoDAO) DeleteVideoByID(dbtx sqlw.DBTX, id int64) error {
	_, err := dbtx.Exec("DELETE FROM Video WHERE id = ?", id)
	return err
}
