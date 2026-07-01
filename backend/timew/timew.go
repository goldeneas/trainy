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
	y, m, _ := date.AddDate(0, 0, -date.Day()+1).Date()
	return time.Date(y, m, 0, 0, 0, 0, 0, date.Location())
}

func EndOfMonth(date time.Time) time.Time {
	y, m, _ := date.AddDate(0, 1, -date.Day()).Date()
	return time.Date(y, m, 0, 0, 0, 0, 0, date.Location())
}
