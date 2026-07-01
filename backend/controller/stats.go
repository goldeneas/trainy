package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/service"
)

type StatsController struct {
	service *service.StatsService
}

func EnableStatsController(router *gin.Engine, statsService *service.StatsService) {
	c := &StatsController{
		service: statsService,
	}

	v1 := router.Group("/v1/stats")
	{
		v1.GET("/routines/monthly", c.GetActualRoutinesThisMonth)
		v1.GET("/frequency/week", c.GetFrequencyThisWeek)
		v1.GET("/workouts", c.GetTotalWorkouts)
	}
}

func (c *StatsController) GetActualRoutinesThisMonth(ctx *gin.Context) {
	res, err := c.service.GetActualRoutinesThisMonth()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if res == nil {
		res = []model.ActualRoutine{}
	}

	ctx.JSON(http.StatusOK, res)
}

func (c *StatsController) GetFrequencyThisWeek(ctx *gin.Context) {
	res := c.service.GetFrequencyThisWeek()
	ctx.JSON(http.StatusOK, res)
}

func (c *StatsController) GetTotalWorkouts(ctx *gin.Context) {
	res := c.service.GetTotalWorkouts()
	ctx.JSON(http.StatusOK, res)
}
