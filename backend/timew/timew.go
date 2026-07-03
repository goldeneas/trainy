package timew

import (
	"time"
)

func BeginningOfWeek(date time.Time) time.Time {
	weekday := int(date.Weekday())
	if weekday == 0 {
		weekday = 7 // set monday as first day
	}

	y, m, d := date.AddDate(0, 0, 1-weekday).Date()
	return time.Date(y, m, d, 0, 0, 0, 0, date.Location())
}

func BeginningOfMonth(date time.Time) time.Time {
	return time.Date(date.Year(), date.Month(), 1, 0, 0, 0, 0, date.Location())
}

func EndOfMonth(date time.Time) time.Time {
	return time.Date(date.Year(), date.Month()+1, 0, 0, 0, 0, 0, date.Location())
}
