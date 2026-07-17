package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	dto_response "github.com/goldeneas/trainy/dto/response"
	"github.com/goldeneas/trainy/httpw"
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
		v1.GET("/exercise/weight/:id", c.GetExerciseWeightStatsByID)
		v1.GET("/distribution/monthly", c.GetMuscleGroupDistributionThisMonth)
		v1.GET("/weekly/hours", c.GetWeeklyWorkoutHourDistributionThisMonth)
	}
}

func (c *StatsController) GetActualRoutinesThisMonth(ctx *gin.Context) {
	httpw.GetAll(ctx, func() ([]model.ActualRoutine, error) {
		return c.service.GetActualRoutinesThisMonth()
	})
}

func (c *StatsController) GetFrequencyThisWeek(ctx *gin.Context) {
	res := c.service.GetFrequencyThisWeek()
	ctx.JSON(http.StatusOK, res)
}

func (c *StatsController) GetTotalWorkouts(ctx *gin.Context) {
	res := c.service.GetTotalWorkouts()
	ctx.JSON(http.StatusOK, res)
}

func (c *StatsController) GetExerciseWeightStatsByID(ctx *gin.Context) {
	httpw.GetByID(ctx, func(id int64) (dto_response.ExerciseWeightStats, error) {
		return c.service.GetExerciseWeightStatsByID(id), nil
	})
}

func (c *StatsController) GetMuscleGroupDistributionThisMonth(ctx *gin.Context) {
	httpw.GetAll(ctx, func() ([]dto_response.MuscleGroupDistribution, error) {
		return c.service.GetMuscleGroupDistributionThisMonth()
	})
}

func (c *StatsController) GetWeeklyWorkoutHourDistributionThisMonth(ctx *gin.Context) {
	httpw.GetAll(ctx, func() ([]dto_response.WeeklyWorkoutHourDistribution, error) {
		return c.service.GetWeeklyWorkoutHourDistributionThisMonth()
	})
}
