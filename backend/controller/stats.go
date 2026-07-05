package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	dto_response "github.com/goldeneas/trainy/dto/response"
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
		v1.GET("/distribution/monthly", c.GetMuscleGroupDistributionThisMonth)
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

func (c *StatsController) GetMuscleGroupDistributionThisMonth(ctx *gin.Context) {
	res, err := c.service.GetMuscleGroupDistributionThisMonth()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if res == nil {
		res = []dto_response.MuscleGroupDistribution{}
	}

	ctx.JSON(http.StatusOK, res)
}

func (c *StatsController) GetWeeklyWorkoutHourDistributionThisMonth(ctx *gin.Context) {
	res, err := c.service.GetWeeklyWorkoutHourDistributionThisMonth()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if res == nil {
		res = []dto_response.WeeklyWorkoutHourDistribution{}
	}

	ctx.JSON(http.StatusOK, res)
}
