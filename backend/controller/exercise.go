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

type ExerciseController struct {
	service *service.ExerciseService
}

func EnableExerciseController(router *gin.Engine, exerciseService *service.ExerciseService) {
	c := &ExerciseController{
		service: exerciseService,
	}

	v1 := router.Group("/v1/exercise")
	{
		// Exercise routes
		v1.POST("", c.CreateExercise)
		v1.GET("", c.GetAllExercises)
		v1.GET("/:id", c.GetExerciseByID)
		v1.DELETE("/:id", c.DeleteExerciseByID)

		// PlannedExercise routes
		v1.POST("/instance", c.RegisterPlannedExercise)
		v1.GET("/instance", c.GetAllPlannedExercises)
		v1.GET("/instance/:id", c.GetPlannedExerciseByID)
		v1.GET("/instance/:id/set_info", c.GetPlannedSetInfosByPlannedExerciseID)
		v1.DELETE("/instance/:id", c.DeletePlannedExercise)

		// RepUnit routes
		v1.GET("/unit", c.GetAllRepUnits)
		v1.GET("/unit/:id", c.GetRepUnitByID)

		// MuscleGroup routes
		v1.GET("/muscle", c.GetAllMuscleGroups)
	}
}

// Exercise Handlers

func (c *ExerciseController) CreateExercise(ctx *gin.Context) {
	var m dto_request.CreateExercise
	if err := ctx.ShouldBindJSON(&m); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ex := model.Exercise{
		Name:         m.Name,
		Notes:        m.Notes,
		ImageID:      m.ImageID,
		Instructions: m.Instructions,
		RepUnitID:    m.RepUnitID,
	}

	id, err := c.service.RegisterExercise(&ex, m.MuscleGroupIDs)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, id)
}

func (c *ExerciseController) GetAllExercises(ctx *gin.Context) {
	httpw.GetAll(ctx, func() ([]dto_response.Exercise, error) {
		return c.service.GetAllExercises()
	})
}

func (c *ExerciseController) GetExerciseByID(ctx *gin.Context) {
	httpw.GetByID(ctx, func(id int64) (*dto_response.Exercise, error) {
		return c.service.GetExerciseByID(id)
	})
}

func (c *ExerciseController) DeleteExerciseByID(ctx *gin.Context) {
	httpw.DeleteByID(ctx, func(id int64) error {
		return c.service.DeleteExerciseByID(id)
	})
}

// PlannedExercise Handlers

func (c *ExerciseController) RegisterPlannedExercise(ctx *gin.Context) {
	var m dto_request.RegisterPlannedExercise
	if err := ctx.ShouldBindJSON(&m); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pe := model.PlannedExercise{
		RestTime:   m.RestTime,
		TimeUnitID: m.TimeUnitID,
		ExerciseID: m.ExerciseID,
		RoutineID:  m.RoutineID,
	}

	infos := make([]model.PlannedSetInfo, len(m.PlannedSetInfos))
	for i, info := range m.PlannedSetInfos {
		infos[i] = model.PlannedSetInfo{
			Ord:               info.Ord,
			PlannedExerciseID: info.PlannedExerciseID,
			Reps:              info.Reps,
			Notes:             info.Notes,
		}
	}

	id, err := c.service.RegisterPlannedExercise(&pe, infos)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, id)
}

func (c *ExerciseController) GetAllPlannedExercises(ctx *gin.Context) {
	httpw.GetAll(ctx, func() ([]model.PlannedExercise, error) {
		return c.service.GetAllPlannedExercises()
	})
}

func (c *ExerciseController) GetPlannedExerciseByID(ctx *gin.Context) {
	httpw.GetByID(ctx, func(id int64) (*model.PlannedExercise, error) {
		return c.service.GetPlannedExerciseByID(id)
	})
}

func (c *ExerciseController) DeletePlannedExercise(ctx *gin.Context) {
	httpw.DeleteByID(ctx, func(id int64) error {
		return c.service.DeletePlannedExerciseByID(id)
	})
}

func (c *ExerciseController) GetPlannedSetInfosByPlannedExerciseID(ctx *gin.Context) {
	httpw.GetAllByID(ctx, func(id int64) ([]model.PlannedSetInfo, error) {
		return c.service.GetAllSetInfoByPlannedExerciseID(id)
	})
}

// Unit routes

func (c *ExerciseController) GetRepUnitByID(ctx *gin.Context) {
	httpw.GetByID(ctx, func(id int64) (*model.RepUnit, error) {
		return c.service.GetRepUnitByID(id)
	})
}

func (c *ExerciseController) GetAllRepUnits(ctx *gin.Context) {
	httpw.GetAll(ctx, func() ([]model.RepUnit, error) {
		return c.service.GetAllRepUnits()
	})
}

func (c *ExerciseController) GetAllMuscleGroups(ctx *gin.Context) {
	httpw.GetAll(ctx, func() ([]model.MuscleGroup, error) {
		return c.service.GetAllMuscleGroups()
	})
}
