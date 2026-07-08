package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	dto_request "github.com/goldeneas/trainy/dto/request"
	"github.com/goldeneas/trainy/httpw"
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/service"
)

type GymController struct {
	service *service.GymService
}

func EnableGymController(router *gin.Engine, gymService *service.GymService) {
	c := &GymController{
		service: gymService,
	}

	v1 := router.Group("/v1/gym")

	location := v1.Group("")
	{
		location.POST("", c.CreateGymLocation)
		location.GET("", c.GetAllGymLocations)
		location.GET("/:id", c.GetGymLocationByID)
		location.PUT("/:id", c.UpdateGymLocationByID)
		location.DELETE("/:id", c.DeleteGymLocationByID)
	}

	equipment := router.Group("/v1/equipment")
	{
		equipment.GET("", c.GetAllGymEquipment)
		equipment.GET("/:id", c.GetGymEquipmentByID)
	}

	locationEquipment := router.Group("/v1/location_equipment")
	{
		locationEquipment.POST("", c.CreateGymLocationEquipment)
		locationEquipment.GET("", c.GetAllGymLocationEquipment)
		locationEquipment.GET("/:id", c.GetGymLocationEquipmentByID)
		locationEquipment.DELETE("/:id", c.DeleteGymLocationEquipmentByID)
	}
}

func (c *GymController) CreateGymLocation(ctx *gin.Context) {
	var m dto_request.CreateGymLocation
	if err := ctx.ShouldBindJSON(&m); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	loc := model.GymLocation{
		Name:      m.Name,
		Altitude:  m.Altitude,
		Longitude: m.Longitude,
		Rating:    m.Rating,
	}

	id, err := c.service.RegisterGymLocation(&loc)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, id)
}

func (c *GymController) GetAllGymLocations(ctx *gin.Context) {
	httpw.GetAll(ctx, func() ([]model.GymLocation, error) {
		return c.service.GetAllGymLocations()
	})
}

func (c *GymController) GetGymLocationByID(ctx *gin.Context) {
	httpw.GetByID(ctx, func(id int64) (*model.GymLocation, error) {
		return c.service.GetGymLocationByID(id)
	})
}

func (c *GymController) UpdateGymLocationByID(ctx *gin.Context) {
	httpw.UpdateByID(ctx, func(id int64, info *dto_request.UpdateGymLocation) error {
		loc := model.GymLocation{
			Name:      info.Name,
			Altitude:  info.Altitude,
			Longitude: info.Longitude,
			Rating:    info.Rating,
		}

		return c.service.UpdateGymLocationByID(id, &loc)
	})
}

func (c *GymController) DeleteGymLocationByID(ctx *gin.Context) {
	httpw.DeleteByID(ctx, func(id int64) error {
		return c.service.DeleteGymLocationByID(id)
	})
}

func (c *GymController) GetAllGymEquipment(ctx *gin.Context) {
	httpw.GetAll(ctx, func() ([]model.GymEquipment, error) {
		return c.service.GetAllGymEquipment()
	})
}

func (c *GymController) GetGymEquipmentByID(ctx *gin.Context) {
	httpw.GetByID(ctx, func(id int64) (*model.GymEquipment, error) {
		return c.service.GetGymEquipmentByID(id)
	})
}

func (c *GymController) CreateGymLocationEquipment(ctx *gin.Context) {
	var m dto_request.CreateGymLocationEquipment
	if err := ctx.ShouldBindJSON(&m); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	le := model.GymLocationEquipment{
		GymLocationID:  m.GymLocationID,
		GymEquipmentID: m.GymEquipmentID,
	}

	id, err := c.service.RegisterGymLocationEquipment(&le)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, id)
}

func (c *GymController) GetAllGymLocationEquipment(ctx *gin.Context) {
	httpw.GetAll(ctx, func() ([]model.GymLocationEquipment, error) {
		return c.service.GetAllGymLocationEquipment()
	})
}

func (c *GymController) GetGymLocationEquipmentByID(ctx *gin.Context) {
	httpw.GetByID(ctx, func(id int64) (*model.GymLocationEquipment, error) {
		return c.service.GetGymLocationEquipmentByID(id)
	})
}

func (c *GymController) DeleteGymLocationEquipmentByID(ctx *gin.Context) {
	httpw.DeleteByID(ctx, func(id int64) error {
		return c.service.DeleteGymLocationEquipmentByID(id)
	})
}
