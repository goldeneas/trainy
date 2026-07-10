package dto_response

type ExerciseProgression struct {
	ID       int64   `json:"id"`
	Name     string  `json:"name"`
	Notes    *string `json:"notes"`
	EntryIDs []int64 `json:"entry_ids"`
}
