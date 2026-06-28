PRAGMA foreign_keys = ON;

CREATE TABLE Image {
    id INTEGER PRIMARY KEY,
    path TEXT
};

CREATE TABLE Exercise {
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    notes TEXT,
    instructions TEXT,
    image_id INTEGER,

    FOREIGN KEY (image_id) REFERENCES Image(id)
        ON DELETE SET NULL
};

CREATE TABLE TimeUnit {
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
};

CREATE TABLE ExerciseInstance {
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

CREATE TABLE SetInfo {
    ord INTEGER NOT NULL,
    exercise_inst_id INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight INTEGER NOT NULL,

    PRIMARY KEY(ord, exercise_inst_id),
    FOREIGN KEY (exercise_inst_id) REFERENCES ExerciseInstance(id)
};

CREATE TABLE Routine {
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_id INTEGER,

    FOREIGN KEY (image_id) REFERENCES Image(id)
        ON DELETE SET NULL
};

CREATE TABLE RoutineInstance {
    id INTEGER PRIMARY KEY,
    finish_timestamp INTEGER NOT NULL,
    routine_id INTEGER NOT NULL,

    FOREIGN KEY (routine_id) REFERENCES Routine(id)
        ON DELETE CASCADE
};
