package sqlw

import "database/sql"

func BulkInsert(db sql.DBTX, base string, data [][]any) error {
	sqlStr := "("
	for _ = range data[0] {
		sqlStr += "?, "
	}

	// remove last ", "
	sqlStr = sqlStr[0 : len(sqlStr)-2]
	sqlStr += "),"

	var vals []any
	for _, row := range data {
		for idx := range len(row) {
			vals = append(vals, row[idx])
		}
	}

	//trim the last ,
	sqlStr = sqlStr[0 : len(sqlStr)-1]
	stmt, err := db.Prepare(sqlStr)
	if err != nil {
		return err
	}

	_, err = stmt.Exec(vals...)
	return err
}
