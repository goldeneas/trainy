package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/goldeneas/trainy/dto/request"
	"github.com/goldeneas/trainy/httpw"
	"github.com/goldeneas/trainy/model"
	"github.com/goldeneas/trainy/service"
)

type VideoController struct {
	service *service.VideoService
}

func EnableVideoController(router *gin.Engine, videoService *service.VideoService) {
	c := &VideoController{
		service: videoService,
	}

	v1 := router.Group("/v1/video")
	{
		v1.POST("", c.CreateVideo)
		v1.GET("/:id", c.GetVideoByID)
	}
}

func (c *VideoController) CreateVideo(ctx *gin.Context) {
	var m dto_request.CreateVideo
	if err := ctx.ShouldBindJSON(&m); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	video := model.Video{
		Link: m.Link,
	}

	id, err := c.service.RegisterVideo(&video)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, id)
}

func (c *VideoController) GetVideoByID(ctx *gin.Context) {
	httpw.GetByID(ctx, func(id int64) (*model.Video, error) {
		return c.service.GetVideoByID(id)
	})
}
