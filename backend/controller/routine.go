package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	dto_request "github.com/goldeneas/trainy/dto/request"
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/service"
)

type RoutineController struct {
	service *service.RoutineService
}

func EnableRoutineController(router *gin.Engine, routineService *service.RoutineService) {
	c := &RoutineController{
		service: routineService,
	}

	v1 := router.Group("/v1/routine")
	{
		// Routine routes
		v1.POST("", c.CreateRoutine)
		v1.GET("", c.GetAllRoutines)
		v1.GET("/:id", c.GetRoutineByID)
		v1.DELETE("/:id", c.DeleteRoutine)

		// ActualRoutine routes
		v1.POST("/instance", c.RegisterActualRoutine)
		v1.GET("/instance", c.GetAllActualRoutines)
		v1.GET("/instance/:id", c.GetActualRoutineByID)
		v1.GET("/instance/:id/set_info", c.GetActualSetInfosByActualRoutineID)
		v1.DELETE("/instance/:id", c.DeleteActualRoutine)
	}
}

// Routine Handlers

func (c *RoutineController) CreateRoutine(ctx *gin.Context) {
	var request dto_request.CreateRoutine
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	r := model.Routine{
		Name:        request.Name,
		Description: request.Description,
		ImageID:     request.ImageID,
	}

	id, err := c.service.RegisterRoutine(&r)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, id)
}

func (c *RoutineController) GetAllRoutines(ctx *gin.Context) {
	res, err := c.service.GetAllRoutines()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if res == nil {
		res = []model.Routine{}
	}

	ctx.JSON(http.StatusOK, res)
}

func (c *RoutineController) GetRoutineByID(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}

	res, err := c.service.GetRoutineByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "routine not found"})
		return
	}

	ctx.JSON(http.StatusOK, res)
}

func (c *RoutineController) DeleteRoutine(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}

	err = c.service.DeleteRoutine(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "routine deleted"})
}

// ActualRoutine Handlers

func (c *RoutineController) RegisterActualRoutine(ctx *gin.Context) {
	var request dto_request.RegisterActualRoutine
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	r := model.ActualRoutine{
		RoutineID:       request.RoutineID,
		StartTimestamp:  request.StartTimestamp,
		FinishTimestamp: request.FinishTimestamp,
	}

	infos := make([]model.ActualSetInfo, 0, len(request.ActualSetInfos))
	for i, info := range request.ActualSetInfos {
		infos[i] = model.ActualSetInfo{
			Weight:           info.Weight,
			PlannedSetInfoID: info.PlannedSetInfoID,
			ActualReps:       info.ActualReps,
		}
	}

	id, err := c.service.RegisterActualRoutine(&r, infos)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, id)
}

func (c *RoutineController) GetAllActualRoutines(ctx *gin.Context) {
	res, err := c.service.GetAllActualRoutines()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if res == nil {
		res = []model.ActualRoutine{}
	}
	ctx.JSON(http.StatusOK, res)
}

func (c *RoutineController) GetActualRoutineByID(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}

	res, err := c.service.GetActualRoutineByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "routine instance not found"})
		return
	}

	ctx.JSON(http.StatusOK, res)
}

func (c *RoutineController) DeleteActualRoutine(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}

	err = c.service.DeleteActualRoutine(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "routine instance deleted"})
}

func (c *RoutineController) GetActualSetInfosByActualRoutineID(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}

	res, err := c.service.GetAllActualSetInfoByActualRoutineID(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if res == nil {
		res = []model.ActualSetInfo{}
	}

	ctx.JSON(http.StatusOK, res)
}
