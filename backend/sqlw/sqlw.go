package sqlw

import (
	"context"
	"database/sql"
)

type DBTX interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
	PrepareContext(ctx context.Context, query string) (*sql.Stmt, error)
	QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error)
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
	Prepare(query string) (*sql.Stmt, error)
	Exec(query string, args ...any) (sql.Result, error)
	QueryRow(query string, args ...any) *sql.Row
	Query(query string, args ...any) (*sql.Rows, error)
}

func QueryAll[T any](dbtx DBTX, scanner func(*sql.Rows, *T) error, query string,
	args ...any) ([]T, error) {

	rows, err := dbtx.Query(query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()
	var list []T
	for rows.Next() {
		var m T
		if err := scanner(rows, &m); err != nil {
			return nil, err
		}

		list = append(list, m)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return list, nil
}
