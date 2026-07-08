package main

import (
	"database/sql"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"

	"github.com/goldeneas/trainy/controller"
	"github.com/goldeneas/trainy/dao"
	"github.com/goldeneas/trainy/service"
)

func main() {
	dbPath := "trainy.db"
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}

	defer db.Close()

	schema, err := os.ReadFile("database.sql")
	if err != nil {
		log.Printf("Warning: could not read database.sql: %v", err)
	} else if _, err := db.Exec(string(schema)); err != nil {
		log.Printf("Warning: failed to execute schema: %v", err)
	}

	exerciseDAO := dao.NewSQLiteExerciseDAO()
	routineDAO := dao.NewSQLiteRoutineDAO()
	statsDAO := dao.NewSQLiteStatsDAO()
	gymDAO := dao.NewSQLiteGymDAO()

	exerciseService := service.NewExerciseService(db, exerciseDAO)
	routineService := service.NewRoutineService(db, routineDAO)
	statsService := service.NewStatsService(db, statsDAO)
	gymService := service.NewGymService(db, gymDAO)

	r := gin.Default()

	controller.EnableExerciseController(r, exerciseService)
	controller.EnableRoutineController(r, routineService)
	controller.EnableStatsController(r, statsService)
	controller.EnableGymController(r, gymService)

	r.Run()
}

