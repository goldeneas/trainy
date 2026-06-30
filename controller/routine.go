package controller

import (
	"net/http"
	"strconv"
	"time"

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

		// RoutineInstance routes
		v1.POST("/instance", c.RegisterRoutineInstance)
		v1.GET("/instance", c.GetAllRoutineInstances)
		v1.GET("/instance/:id", c.GetRoutineInstanceByID)
		v1.DELETE("/instance/:id", c.DeleteRoutineInstance)
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

// RoutineInstance Handlers

func (c *RoutineController) RegisterRoutineInstance(ctx *gin.Context) {
	var request dto_request.RegisterRoutineInstance
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	r := model.RoutineInstance{
		RoutineID:       request.RoutineID,
		FinishTimestamp: time.Now().Unix(),
	}

	infos := make([]model.WeightInfo, len(request.WeightInfo))
	for i, info := range request.WeightInfo {
		infos[i] = model.WeightInfo{
			Weight:    info.Weight,
			SetInfoID: info.SetInfoID,
		}
	}

	id, err := c.service.RegisterRoutineInstance(&r, infos)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, id)
}

func (c *RoutineController) GetAllRoutineInstances(ctx *gin.Context) {
	res, err := c.service.GetAllRoutineInstances()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if res == nil {
		res = []model.RoutineInstance{}
	}
	ctx.JSON(http.StatusOK, res)
}

func (c *RoutineController) GetRoutineInstanceByID(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}

	res, err := c.service.GetRoutineInstanceByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "routine instance not found"})
		return
	}

	ctx.JSON(http.StatusOK, res)
}

func (c *RoutineController) DeleteRoutineInstance(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}

	err = c.service.DeleteRoutineInstance(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "routine instance deleted"})
}
