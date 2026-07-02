# Trainy Backend API Specifications

This document defines the REST API endpoints, routing, and data models of the **Trainy** backend. Frontend applications should use this specification to integrate with the backend services.

## Overview
* **Base URL**: `http://localhost:8080` (Default Gin port)
* **Content-Type**: `application/json` for all requests and responses
* **Error Response Format**: 
  When a request fails, the API returns a JSON object containing the error message:
  ```json
  {
    "error": "Detailed description of the error"
  }
  ```

---

## Table of Contents
1. [Exercise Endpoints](#1-exercise-endpoints)
2. [Planned Exercise Endpoints](#2-planned-exercise-endpoints)
3. [Routine Endpoints](#3-routine-endpoints)
4. [Routine Instance Endpoints](#4-routine-instance-endpoints)
5. [Stats Endpoints](#5-stats-endpoints)
6. [Data Type Definitions (DTOs & Models)](#6-data-type-definitions-dtos--models)

---

## 1. Exercise Endpoints
Manages the global library of available exercises (e.g. "Squats", "Bench Press").
Source Handler: [ExerciseController](file:///Users/nicola/Workspace/trainy/backend/controller/exercise.go#L13)

### Create Exercise
* **Method & Path**: `POST /v1/exercise`
* **Description**: Adds a new exercise definition to the library.
* **Request Body**: [dto_request.CreateExercise](file:///Users/nicola/Workspace/trainy/backend/dto/request/exercise.go#L3-L8)
  ```json
  {
    "name": "string",          // Required. Name of the exercise.
    "notes": "string",         // Optional. Additional description or details.
    "instructions": "string",  // Optional. Text instructions on how to perform the exercise.
    "image_id": 1              // Optional/Nullable. Integer ID of the associated image.
  }
  ```
* **Responses**:
  * **`201 Created`**: Returns the generated unique ID of the exercise.
    ```json
    15
    ```
  * **`400 Bad Request`**: Request validation error.
  * **`500 Internal Server Error`**: Database error.

### Get All Exercises
* **Method & Path**: `GET /v1/exercise`
* **Description**: Returns all exercises in the library.
* **Response**: `200 OK`
  * **Body**: Array of [model.Exercise](file:///Users/nicola/Workspace/trainy/backend/model/exercise.go#L3-L9)
    ```json
    [
      {
        "ID": 1,
        "Name": "Pushups",
        "Notes": "Standard pushups",
        "Instructions": "Keep core tight, lower your chest until it almost touches the floor.",
        "ImageID": null
      }
    ]
    ```
    *Note: Returns `[]` if no exercises exist.*
  * **Responses**:
    * **`500 Internal Server Error`**: Database error.

### Get Exercise By ID
* **Method & Path**: `GET /v1/exercise/:id`
* **Description**: Returns a single exercise by ID.
* **Path Parameters**:
  * `id` (integer): ID of the exercise.
* **Responses**:
  * **`200 OK`**: Returns [model.Exercise](file:///Users/nicola/Workspace/trainy/backend/model/exercise.go#L3-L9)
    ```json
    {
      "ID": 1,
      "Name": "Pushups",
      "Notes": "Standard pushups",
      "Instructions": "Keep core tight...",
      "ImageID": null
    }
    ```
  * **`400 Bad Request`**: `"invalid ID format"`
  * **`404 Not Found`**: `"exercise not found"`

### Delete Exercise
* **Method & Path**: `DELETE /v1/exercise/:id`
* **Description**: Deletes an exercise from the library.
* **Path Parameters**:
  * `id` (integer): ID of the exercise to delete.
* **Responses**:
  * **`200 OK`**: Success message.
    ```json
    {
      "message": "exercise deleted"
    }
    ```
  * **`400 Bad Request`**: `"invalid ID format"`
  * **`500 Internal Server Error`**: Database error.

---

## 2. Planned Exercise Endpoints
Manages planned exercises (the association of exercises with a routine, specifying template values like target reps, ord, and rest times).
Source Handler: [ExerciseController](file:///Users/nicola/Workspace/trainy/backend/controller/exercise.go#L13)

### Register Planned Exercise
* **Method & Path**: `POST /v1/exercise/instance`
* **Description**: Associates an exercise to a routine as a template (planned exercise) along with its planned set info.
* **Request Body**: [dto_request.RegisterPlannedExercise](file:///Users/nicola/Workspace/trainy/backend/dto/request/exercise.go#L10-L16)
  ```json
  {
    "rest_time": 90,           // Optional/Nullable. Rest time in seconds.
    "time_unit_id": 1,         // Optional/Nullable. ID referencing the time unit table.
    "exercise_id": 1,          // Required. The Exercise ID.
    "routine_id": 1,           // Required. The Routine ID.
    "planned_set_infos": [     // Array of planned set configurations.
      {
        "ord": 1,              // Sequence number of the set.
        "reps": 10,            // Target repetition count.
        "notes": "Go heavy"    // Notes for this set.
      }
    ]
  }
  ```
* **Responses**:
  * **`201 Created`**: Returns the generated ID of the planned exercise.
    ```json
    5
    ```
  * **`400 Bad Request`**: Request validation error.
  * **`500 Internal Server Error`**: Database error.

### Get All Planned Exercises
* **Method & Path**: `GET /v1/exercise/instance`
* **Description**: Returns all planned exercises.
* **Response**: `200 OK`
  * **Body**: Array of [model.PlannedExercise](file:///Users/nicola/Workspace/trainy/backend/model/exercise.go#L11-L17)
    ```json
    [
      {
        "ID": 1,
        "RestTime": 90,
        "TimeUnitID": 1,
        "ExerciseID": 1,
        "RoutineID": 1
      }
    ]
    ```
    *Note: Returns `[]` if none exist.*
  * **Responses**:
    * **`500 Internal Server Error`**: Database error.

### Get Planned Exercise By ID
* **Method & Path**: `GET /v1/exercise/instance/:id`
* **Description**: Returns a single planned exercise template by its ID.
* **Path Parameters**:
  * `id` (integer): ID of the planned exercise template.
* **Responses**:
  * **`200 OK`**: Returns [model.PlannedExercise](file:///Users/nicola/Workspace/trainy/backend/model/exercise.go#L11-L17)
    ```json
    {
      "ID": 1,
      "RestTime": 90,
      "TimeUnitID": 1,
      "ExerciseID": 1,
      "RoutineID": 1
    }
    ```
  * **`400 Bad Request`**: `"invalid ID format"`
  * **`404 Not Found`**: `"exercise instance not found"`

### Delete Planned Exercise
* **Method & Path**: `DELETE /v1/exercise/instance/:id`
* **Description**: Deletes a planned exercise by its ID.
* **Path Parameters**:
  * `id` (integer): ID of the planned exercise to delete.
* **Responses**:
  * **`200 OK`**: Success message.
    ```json
    {
      "message": "exercise instance deleted"
    }
    ```
  * **`400 Bad Request`**: `"invalid ID format"`
  * **`500 Internal Server Error`**: Database error.

---

## 3. Routine Endpoints
Manages routines (workouts containing set definitions).
Source Handler: [RoutineController](file:///Users/nicola/Workspace/trainy/backend/controller/routine.go#L14)

### Create Routine
* **Method & Path**: `POST /v1/routine`
* **Description**: Creates a new workout routine template.
* **Request Body**: [dto_request.CreateRoutine](file:///Users/nicola/Workspace/trainy/backend/dto/request/routine.go#L3-L7)
  ```json
  {
    "name": "string",         // Required. Name of the routine.
    "description": "string",  // Optional. Description of the routine.
    "image_id": 1             // Optional/Nullable. ID of the associated image.
  }
  ```
* **Responses**:
  * **`201 Created`**: Returns the generated ID of the routine.
    ```json
    3
    ```
  * **`400 Bad Request`**: Request validation error.
  * **`500 Internal Server Error`**: Database error.

### Get All Routines
* **Method & Path**: `GET /v1/routine`
* **Description**: Returns all routine templates.
* **Response**: `200 OK`
  * **Body**: Array of [model.Routine](file:///Users/nicola/Workspace/trainy/backend/model/routine.go#L3-L8)
    ```json
    [
      {
        "ID": 3,
        "Name": "Upper Body Push",
        "Description": "Focuses on Chest, Shoulders, and Triceps",
        "ImageID": 2
      }
    ]
    ```
    *Note: Returns `[]` if no routines exist.*
  * **Responses**:
    * **`500 Internal Server Error`**: Database error.

### Get Routine By ID
* **Method & Path**: `GET /v1/routine/:id`
* **Description**: Returns a single routine by its ID.
* **Path Parameters**:
  * `id` (integer): ID of the routine.
* **Responses**:
  * **`200 OK`**: Returns [model.Routine](file:///Users/nicola/Workspace/trainy/backend/model/routine.go#L3-L8)
    ```json
    {
      "ID": 3,
      "Name": "Upper Body Push",
      "Description": "Focuses on Chest, Shoulders, and Triceps",
      "ImageID": 2
    }
    ```
  * **`400 Bad Request`**: `"invalid ID format"`
  * **`404 Not Found`**: `"routine not found"`

### Delete Routine
* **Method & Path**: `DELETE /v1/routine/:id`
* **Description**: Deletes a routine by its ID.
* **Path Parameters**:
  * `id` (integer): ID of the routine to delete.
* **Responses**:
  * **`200 OK`**: Success message.
    ```json
    {
      "message": "routine deleted"
    }
    ```
  * **`400 Bad Request`**: `"invalid ID format"`
  * **`500 Internal Server Error`**: Database error.

---

## 4. Routine Instance Endpoints
Manages completed workout logs (instances of a routine, indicating that a routine was performed at a specific time with specific weights and reps).
Source Handler: [RoutineController](file:///Users/nicola/Workspace/trainy/backend/controller/routine.go#L14)

### Register Routine Instance
* **Method & Path**: `POST /v1/routine/instance`
* **Description**: Logs a completed routine workout, recording the actual weights lifted and repetitions achieved. The backend automatically records the current timestamp as the completion time.
* **Request Body**: [dto_request.RegisterActualRoutine](file:///Users/nicola/Workspace/trainy/backend/dto/request/routine.go#L9-L12)
  ```json
  {
    "routine_id": 1,               // Required. The routine template ID.
    "actual_set_infos": [          // Array of actual set results.
      {
        "weight": 22.5,            // Required. Weight lifted in kg/lbs.
        "planned_set_info_id": 1,  // Required. ID referencing the PlannedSetInfo template.
        "actual_reps": 10          // Required. The actual repetitions completed.
      }
    ]
  }
  ```
* **Responses**:
  * **`201 Created`**: Returns the generated ID of the routine instance.
    ```json
    8
    ```
  * **`400 Bad Request`**: Request validation error.
  * **`500 Internal Server Error`**: Database error.

### Get All Routine Instances
* **Method & Path**: `GET /v1/routine/instance`
* **Description**: Returns all routine instances (workout logs).
* **Response**: `200 OK`
  * **Body**: Array of [model.ActualRoutine](file:///Users/nicola/Workspace/trainy/backend/model/routine.go#L10-L14)
    ```json
    [
      {
        "ID": 8,
        "FinishTimestamp": 1782346790, // UNIX timestamp in seconds
        "RoutineID": 1
      }
    ]
    ```
    *Note: Returns `[]` if no routine instances exist.*
  * **Responses**:
    * **`500 Internal Server Error`**: Database error.

### Get Routine Instance By ID
* **Method & Path**: `GET /v1/routine/instance/:id`
* **Description**: Returns a single routine instance (workout log) by its ID.
* **Path Parameters**:
  * `id` (integer): ID of the routine instance.
* **Responses**:
  * **`200 OK`**: Returns [model.ActualRoutine](file:///Users/nicola/Workspace/trainy/backend/model/routine.go#L10-L14)
    ```json
    {
      "ID": 8,
      "FinishTimestamp": 1782346790,
      "RoutineID": 1
    }
    ```
  * **`400 Bad Request`**: `"invalid ID format"`
  * **`404 Not Found`**: `"routine instance not found"`

### Delete Routine Instance
* **Method & Path**: `DELETE /v1/routine/instance/:id`
* **Description**: Deletes a routine instance (workout log) by its ID.
* **Path Parameters**:
  * `id` (integer): ID of the routine instance to delete.
* **Responses**:
  * **`200 OK`**: Success message.
    ```json
    {
      "message": "routine instance deleted"
    }
    ```
  * **`400 Bad Request`**: `"invalid ID format"`
  * **`500 Internal Server Error`**: Database error.

---

## 5. Stats Endpoints
Provides statistical analysis and insights about routines and workouts.
Source Handler: [StatsController](file:///Users/nicola/Workspace/trainy/backend/controller/stats.go#L11)

### Get Actual Routines This Month
* **Method & Path**: `GET /v1/stats/routines/monthly`
* **Description**: Returns all actual routines completed in the current month.
* **Responses**:
  * **`200 OK`**: Array of [model.ActualRoutine](file:///Users/nicola/Workspace/trainy/backend/model/routine.go#L10-L14)
    ```json
    [
      {
        "ID": 8,
        "FinishTimestamp": 1782346790,
        "RoutineID": 1
      }
    ]
    ```
    *Note: Returns `[]` if no routines have been completed this month.*
  * **`500 Internal Server Error`**: Database error.

### Get Frequency This Week
* **Method & Path**: `GET /v1/stats/frequency/week`
* **Description**: Returns the frequency (number of workouts completed) for the current week.
* **Responses**:
  * **`200 OK`**: Returns the count as an integer.
    ```json
    3
    ```

### Get Total Workouts
* **Method & Path**: `GET /v1/stats/workouts`
* **Description**: Returns the total number of workouts completed.
* **Responses**:
  * **`200 OK`**: Returns the count as an integer.
    ```json
    42
    ```

---

## 6. Data Type Definitions (DTOs & Models)

Below are the exact Go structures representing requests and responses. Note that for JSON serialization, default fields capitalization is used when Go struct tags are not specified on the `model` structs, whereas explicit lowercase `json` struct tags are used on request `dto` structures.

### Request DTOs
Defined in [dto/request](file:///Users/nicola/Workspace/trainy/backend/dto/request):

#### CreateExercise
```go
type CreateExercise struct {
	Name         string `json:"name"`
	Notes        string `json:"notes"`
	Instructions string `json:"instructions"`
	ImageID      *int64 `json:"image_id"`
}
```

#### RegisterPlannedExercise
```go
type RegisterPlannedExercise struct {
	RestTime        *int             `json:"rest_time"`
	TimeUnitID      *int64           `json:"time_unit_id"`
	ExerciseID      int64            `json:"exercise_id"`
	RoutineID       int64            `json:"routine_id"`
	PlannedSetInfos []PlannedSetInfo `json:"planned_set_infos"`
}
```

#### PlannedSetInfo (Request)
```go
type PlannedSetInfo struct {
	Ord               int    `json:"ord"`
	PlannedExerciseID int64  `json:"planned_exercise_id"`
	Reps              int    `json:"reps"`
	Notes             string `json:"notes"`
}
```

#### CreateRoutine
```go
type CreateRoutine struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageID     *int64 `json:"image_id"`
}
```

#### RegisterActualRoutine
```go
type RegisterActualRoutine struct {
	RoutineID      int64           `json:"routine_id"`
	ActualSetInfos []ActualSetInfo `json:"actual_set_infos"`
}
```

#### ActualSetInfo (Request)
```go
type ActualSetInfo struct {
	Weight           float64 `json:"weight"`
	PlannedSetInfoID int64   `json:"planned_set_info_id"`
	ActualReps       int64   `json:"actual_reps"`
}
```

---

### Response/Database Models
Defined in [model](file:///Users/nicola/Workspace/trainy/backend/model):

#### Exercise
```go
type Exercise struct {
	ID           int64
	Name         string
	Notes        string
	Instructions string
	ImageID      *int64
}
```

#### PlannedExercise
```go
type PlannedExercise struct {
	ID         int64
	RestTime   *int
	TimeUnitID *int64
	ExerciseID int64
	RoutineID  int64
}
```

#### PlannedSetInfo (Model)
```go
type PlannedSetInfo struct {
	ID                int64
	Ord               int
	PlannedExerciseID int64
	Reps              int
	Notes             string
}
```

#### Routine
```go
type Routine struct {
	ID          int64
	Name        string
	Description string
	ImageID     *int64
}
```

#### ActualRoutine
```go
type ActualRoutine struct {
	ID              int64
	FinishTimestamp int64
	RoutineID       int64
}
```

#### ActualSetInfo (Model)
```go
type ActualSetInfo struct {
	ID               int64
	Weight           float64
	ActualRoutineID  int64
	PlannedSetInfoID int64
	ActualReps       int64
}
```

#### Image
```go
type Image struct {
	ID   int64
	Path string
}
```

#### TimeUnit
```go
type TimeUnit struct {
	ID   int64
	Name string
}
```
