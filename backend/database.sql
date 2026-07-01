PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Image (
    id INTEGER PRIMARY KEY,
    path TEXT
);

CREATE TABLE IF NOT EXISTS Exercise (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    notes TEXT,
    instructions TEXT,
    image_id INTEGER,

    FOREIGN KEY (image_id) REFERENCES Image(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS TimeUnit (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS PlannedExercise (
    id INTEGER PRIMARY KEY,
    rest_time INTEGER,
    time_unit_id INTEGER,
    exercise_id INTEGER NOT NULL,
    routine_id INTEGER NOT NULL,

    FOREIGN KEY (routine_id) REFERENCES Routine(id)
        ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES Exercise(id)
        ON DELETE CASCADE,
    FOREIGN KEY (time_unit_id) REFERENCES TimeUnit(id)
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS PlannedSetInfo (
    id INTEGER PRIMARY KEY,
    ord INTEGER NOT NULL,
    planned_exercise_id INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    notes TEXT,

    UNIQUE(ord, planned_exercise_id),

    FOREIGN KEY (planned_exercise_id) REFERENCES PlannedExercise(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Routine (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_id INTEGER,

    FOREIGN KEY (image_id) REFERENCES Image(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ActualRoutine (
    id INTEGER PRIMARY KEY,
    finish_timestamp INTEGER NOT NULL,
    routine_id INTEGER NOT NULL,

    FOREIGN KEY (routine_id) REFERENCES Routine(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ActualSetInfo (
    id INTEGER PRIMARY KEY,
    weight REAL NOT NULL,
    actual_routine_id INTEGER NOT NULL,
    set_info_id INTEGER NOT NULL,
    actual_reps INTEGER NOT NULL,

    FOREIGN KEY (actual_routine_id) REFERENCES ActualRoutine(id)
        ON DELETE CASCADE,
    FOREIGN KEY (set_info_id) REFERENCES PlannedSetInfo(id)
        ON DELETE CASCADE
);
