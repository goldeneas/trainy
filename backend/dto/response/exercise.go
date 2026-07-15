package dto_response

type Exercise struct {
	ID             int64   `json:"id"`
	Name           string  `json:"name"`
	Notes          string  `json:"notes"`
	Instructions   string  `json:"instructions"`
	ImageID        *int64  `json:"image_id"`
	RepUnitID      int64   `json:"rep_unit_id"`
	MuscleGroupIDs []int64 `json:"muscle_group_ids"`
	VideoID        *int64  `json:"video_id"`
}
