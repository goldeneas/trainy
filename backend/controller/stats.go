package controller

import (
	"github.com/gin-gonic/gin"
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

}

func (c *StatsController) GetFrequencyThisWeek(ctx *gin.Context) {

}

func (c *StatsController) GetTotalWorkouts(ctx *gin.Context) {

}
