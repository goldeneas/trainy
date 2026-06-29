package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/goldeneas/trainy/dao"
	dto_request "github.com/goldeneas/trainy/dto/request"
	"github.com/goldeneas/trainy/model"
)

type ExerciseController struct {
	dao dao.ExerciseDAO
}

func EnableExerciseController(router *gin.Engine, exerciseDAO dao.ExerciseDAO) {
	c := &ExerciseController{
		dao: exerciseDAO,
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

	model := model.Exercise{
		Name:         m.Name,
		Notes:        m.Notes,
		ImageID:      m.ImageID,
		Instructions: m.Instructions,
	}

	id, err := c.dao.InsertExercise(&model)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, id)
}

func (c *ExerciseController) GetAllExercises(ctx *gin.Context) {
	res, err := c.dao.GetAllExercises()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if res == nil {
		res = []model.Exercise{}
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

	res, err := c.dao.GetExerciseByID(id)
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

	err = c.dao.DeleteExercise(id)
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

	model := model.PlannedExercise{
		RestTime:   m.RestTime,
		TimeUnitID: m.TimeUnitID,
		ExerciseID: m.ExerciseID,
		RoutineID:  m.RoutineID,
	}

	id, err := c.dao.InsertPlannedExercise(&model)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, id)
}

func (c *ExerciseController) GetAllPlannedExercises(ctx *gin.Context) {
	res, err := c.dao.GetAllPlannedExercises()
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

	res, err := c.dao.GetPlannedExerciseByID(id)
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

	err = c.dao.DeletePlannedExercise(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "exercise instance deleted"})
}
