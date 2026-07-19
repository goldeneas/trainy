package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	dto_request "github.com/goldeneas/trainy/dto/request"
	"github.com/goldeneas/trainy/httpw"
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
		v1.POST("", c.CreateRoutine)
		v1.GET("", c.GetAllRoutines)
		v1.GET("/:id", c.GetRoutineByID)
		v1.DELETE("/:id", c.DeleteRoutineByID)
		v1.PUT("/:id", c.UpdateRoutineByID)

		v1.POST("/instance", c.RegisterActualRoutine)
		v1.GET("/instance", c.GetAllActualRoutines)
		v1.GET("/instance/:id", c.GetActualRoutineByID)
		v1.GET("/instance/:id/set_info", c.GetAllActualSetInfosByActualRoutineID)
		v1.DELETE("/instance/:id", c.DeleteActualRoutineByID)
	}
}

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
	httpw.GetAll(ctx, func() ([]model.Routine, error) {
		return c.service.GetAllRoutines()
	})
}

func (c *RoutineController) GetRoutineByID(ctx *gin.Context) {
	httpw.GetByID(ctx, func(id int64) (*model.Routine, error) {
		return c.service.GetRoutineByID(id)
	})
}

func (c *RoutineController) DeleteRoutineByID(ctx *gin.Context) {
	httpw.DeleteByID(ctx, func(id int64) error {
		return c.service.DeleteRoutineByID(id)
	})
}

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
		Latitude:        request.Latitude,
		Longitude:       request.Longitude,
	}

	infos := make([]model.ActualSetInfo, 0, len(request.ActualSetInfos))
	for _, info := range request.ActualSetInfos {
		m := model.ActualSetInfo{
			Weight:           info.Weight,
			PlannedSetInfoID: info.PlannedSetInfoID,
			ActualReps:       info.ActualReps,
		}

		infos = append(infos, m)
	}

	id, err := c.service.RegisterActualRoutine(&r, infos)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, id)
}

func (c *RoutineController) GetAllActualRoutines(ctx *gin.Context) {
	httpw.GetAll(ctx, func() ([]model.ActualRoutine, error) {
		return c.service.GetAllActualRoutines()
	})
}

func (c *RoutineController) GetActualRoutineByID(ctx *gin.Context) {
	httpw.GetByID(ctx, func(id int64) (*model.ActualRoutine, error) {
		return c.service.GetActualRoutineByID(id)
	})
}

func (c *RoutineController) DeleteActualRoutineByID(ctx *gin.Context) {
	httpw.DeleteByID(ctx, func(id int64) error {
		return c.service.DeleteActualRoutineByID(id)
	})
}

func (c *RoutineController) GetAllActualSetInfosByActualRoutineID(ctx *gin.Context) {
	httpw.GetAllByID(ctx, func(id int64) ([]model.ActualSetInfo, error) {
		return c.service.GetAllActualSetInfoByActualRoutineID(id)
	})
}

func (c *RoutineController) UpdateRoutineByID(ctx *gin.Context) {
	httpw.UpdateByID(ctx, func(id int64, info *dto_request.UpdateRoutine) error {
		r := model.Routine{
			ID:          id,
			Name:        info.Name,
			Description: info.Description,
			ImageID:     info.ImageID,
		}
		return c.service.UpdateRoutineByID(&r)
	})
}
