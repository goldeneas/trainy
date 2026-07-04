package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	dto_request "github.com/goldeneas/trainy/dto/request"
	dto_response "github.com/goldeneas/trainy/dto/response"
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
		v1.DELETE("/:id", c.DeleteExercise)

		// PlannedExercise routes
		v1.POST("/instance", c.RegisterPlannedExercise)
		v1.GET("/instance", c.GetAllPlannedExercises)
		v1.GET("/instance/:id", c.GetPlannedExerciseByID)
		v1.GET("/instance/:id/set_info", c.GetSetInfosByPlannedExerciseID)
		v1.DELETE("/instance/:id", c.DeletePlannedExercise)
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
	}

	id, err := c.service.RegisterExercise(&ex, m.MuscleGroupIDs)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, id)
}

func (c *ExerciseController) GetAllExercises(ctx *gin.Context) {
	res, err := c.service.GetAllExercises()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if res == nil {
		res = []dto_response.Exercise{}
	}

	ctx.JSON(http.StatusOK, res)
}

func (c *ExerciseController) GetExerciseByID(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}

	res, err := c.service.GetExerciseByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "exercise not found"})
		return
	}

	ctx.JSON(http.StatusOK, res)
}

func (c *ExerciseController) DeleteExercise(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}

	err = c.service.DeleteExercise(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "exercise deleted"})
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

	infos := make([]model.PlannedSetInfo, 0, len(m.PlannedSetInfos))
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
	res, err := c.service.GetAllPlannedExercises()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if res == nil {
		res = []model.PlannedExercise{}
	}
	ctx.JSON(http.StatusOK, res)
}

func (c *ExerciseController) GetPlannedExerciseByID(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}

	res, err := c.service.GetPlannedExerciseByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "exercise instance not found"})
		return
	}

	ctx.JSON(http.StatusOK, res)
}

func (c *ExerciseController) DeletePlannedExercise(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}

	err = c.service.DeletePlannedExercise(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "exercise instance deleted"})
}

func (c *ExerciseController) GetSetInfosByPlannedExerciseID(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}

	res, err := c.service.GetAllSetInfoByPlannedExerciseID(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if res == nil {
		res = []model.PlannedSetInfo{}
	}

	ctx.JSON(http.StatusOK, res)
}
