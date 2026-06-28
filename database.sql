PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Image {
    id INTEGER PRIMARY KEY,
    path TEXT
};

CREATE TABLE IF NOT EXISTS Exercise {
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    notes TEXT,
    instructions TEXT,
    image_id INTEGER,

    FOREIGN KEY (image_id) REFERENCES Image(id)
        ON DELETE SET NULL
};

CREATE TABLE IF NOT EXISTS TimeUnit {
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
};

CREATE TABLE IF NOT EXISTS ExerciseInstance {
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
};

CREATE TABLE IF NOT EXISTS SetInfo {
    id INTEGER PRIMARY KEY,
    ord INTEGER NOT NULL,
    exercise_inst_id INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight INTEGER NOT NULL,

    FOREIGN KEY (exercise_inst_id) REFERENCES ExerciseInstance(id)
        ON DELETE CASCADE
};

CREATE TABLE IF NOT EXISTS Routine {
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_id INTEGER,

    FOREIGN KEY (image_id) REFERENCES Image(id)
        ON DELETE SET NULL
};

CREATE TABLE IF NOT EXISTS RoutineInstance {
    id INTEGER PRIMARY KEY,
    finish_timestamp INTEGER NOT NULL,
    routine_id INTEGER NOT NULL,

    FOREIGN KEY (routine_id) REFERENCES Routine(id)
        ON DELETE CASCADE
};
