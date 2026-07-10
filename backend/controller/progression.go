package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	dto_request "github.com/goldeneas/trainy/dto/request"
	dto_response "github.com/goldeneas/trainy/dto/response"
	"github.com/goldeneas/trainy/httpw"
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/service"
)

type ProgressionController struct {
	service *service.ProgressionService
}

func EnableProgressionController(router *gin.Engine, progressionService *service.ProgressionService) {
	c := &ProgressionController{
		service: progressionService,
	}

	progression := router.Group("/v1/progression")
	{
		progression.POST("", c.CreateExerciseProgression)
		progression.GET("", c.GetAllExerciseProgressions)
		progression.GET("/:id", c.GetExerciseProgressionByID)
		progression.PUT("/:id", c.UpdateExerciseProgressionByID)
		progression.DELETE("/:id", c.DeleteExerciseProgressionByID)
	}

	progression_entry := router.Group("/v1/progression_entry")
	{
		progression_entry.POST("", c.CreateExerciseProgressionEntry)
		progression_entry.GET("", c.GetAllExerciseProgressionEntries)
		progression_entry.GET("/:id", c.GetExerciseProgressionEntryByID)
		progression_entry.PUT("/:id", c.UpdateExerciseProgressionEntryByID)
		progression_entry.DELETE("/:id", c.DeleteExerciseProgressionEntryByID)
	}
}

func (c *ProgressionController) CreateExerciseProgression(ctx *gin.Context) {
	var m dto_request.CreateExerciseProgression
	if err := ctx.ShouldBindJSON(&m); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	prog := model.ExerciseProgression{
		Name:  m.Name,
		Notes: m.Notes,
	}

	id, err := c.service.RegisterExerciseProgression(&prog)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, id)
}

func (c *ProgressionController) GetAllExerciseProgressions(ctx *gin.Context) {
	httpw.GetAll(ctx, func() ([]dto_response.ExerciseProgression, error) {
		return c.service.GetAllExerciseProgressions()
	})
}

func (c *ProgressionController) GetExerciseProgressionByID(ctx *gin.Context) {
	httpw.GetByID(ctx, func(id int64) (*dto_response.ExerciseProgression, error) {
		return c.service.GetExerciseProgressionByID(id)
	})
}

func (c *ProgressionController) UpdateExerciseProgressionByID(ctx *gin.Context) {
	httpw.UpdateByID(ctx, func(id int64, info *dto_request.UpdateExerciseProgression) error {
		prog := model.ExerciseProgression{
			Name:  info.Name,
			Notes: info.Notes,
		}

		return c.service.UpdateExerciseProgressionByID(id, &prog)
	})
}

func (c *ProgressionController) DeleteExerciseProgressionByID(ctx *gin.Context) {
	httpw.DeleteByID(ctx, func(id int64) error {
		return c.service.DeleteExerciseProgressionByID(id)
	})
}

func (c *ProgressionController) CreateExerciseProgressionEntry(ctx *gin.Context) {
	var m dto_request.CreateExerciseProgressionEntry
	if err := ctx.ShouldBindJSON(&m); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entry := model.ExerciseProgressionEntry{
		ExerciseID:            m.ExerciseID,
		ExerciseProgressionID: m.ExerciseProgressionID,
	}

	id, err := c.service.RegisterExerciseProgressionEntry(&entry)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, id)
}

func (c *ProgressionController) GetAllExerciseProgressionEntries(ctx *gin.Context) {
	httpw.GetAll(ctx, func() ([]model.ExerciseProgressionEntry, error) {
		return c.service.GetAllExerciseProgressionEntries()
	})
}

func (c *ProgressionController) GetExerciseProgressionEntryByID(ctx *gin.Context) {
	httpw.GetByID(ctx, func(id int64) (*model.ExerciseProgressionEntry, error) {
		return c.service.GetExerciseProgressionEntryByID(id)
	})
}

func (c *ProgressionController) UpdateExerciseProgressionEntryByID(ctx *gin.Context) {
	httpw.UpdateByID(ctx, func(id int64, info *dto_request.UpdateExerciseProgressionEntry) error {
		entry := model.ExerciseProgressionEntry{
			ExerciseID:            info.ExerciseID,
			ExerciseProgressionID: info.ExerciseProgressionID,
		}

		return c.service.UpdateExerciseProgressionEntryByID(id, &entry)
	})
}

func (c *ProgressionController) DeleteExerciseProgressionEntryByID(ctx *gin.Context) {
	httpw.DeleteByID(ctx, func(id int64) error {
		return c.service.DeleteExerciseProgressionEntryByID(id)
	})
}
