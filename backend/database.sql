CREATE TABLE IF NOT EXISTS Image (
    id INTEGER PRIMARY KEY,
    path TEXT
);

CREATE TABLE IF NOT EXISTS Routine (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_id INTEGER,

    FOREIGN KEY (image_id) REFERENCES Image(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS RepUnit (
    id INTEGER PRIMARY KEY,
    name_singular STRING NOT NULL,
    name_plural STRING NOT NULL
);

CREATE TABLE IF NOT EXISTS GymLocation (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    altitude REAL NOT NULL,
    longitude REAL NOT NULL,
    rating INTEGER,

    CHECK (rating >= 0 AND rating <= 5)
);

CREATE TABLE IF NOT EXISTS GymEquipment (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS GymLocationEquipment (
    id INTEGER PRIMARY KEY,
    gym_location_id INTEGER NOT NULL,
    gym_equipment_id INTEGER NOT NULL,

    FOREIGN KEY (gym_location_id) REFERENCES GymLocation(id)
        ON DELETE CASCADE,
    FOREIGN KEY (gym_equipment_id) REFERENCES GymEquipment(id)
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS MuscleGroup (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Video (
    id INTEGER PRIMARY KEY,
    link TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Exercise (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    notes TEXT,
    instructions TEXT,
    image_id INTEGER,
    rep_unit_id INTEGER NOT NULL,
    video_id INTEGER,

    FOREIGN KEY (image_id) REFERENCES Image(id)
        ON DELETE SET NULL,
    FOREIGN KEY (rep_unit_id) REFERENCES RepUnit(id)
        ON DELETE RESTRICT,
    FOREIGN KEY (video_id) REFERENCES Video(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ExerciseProgression (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS ExerciseProgressionEntry (
    id INTEGER PRIMARY KEY,
    exercise_id INTEGER NOT NULL,
    exercise_progression_id INTEGER NOT NULL,

    FOREIGN KEY (exercise_id) REFERENCES Exercise(id)
        ON DELETE CASCADE,
    FOREIGN KEY (exercise_progression_id) REFERENCES ExerciseProgression(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ExerciseMuscleGroup (
    id INTEGER PRIMARY KEY,
    exercise_id INTEGER,
    muscle_group_id INTEGER,

    FOREIGN KEY (exercise_id) REFERENCES Exercise(id)
        ON DELETE CASCADE,
    FOREIGN KEY (muscle_group_id) REFERENCES MuscleGroup(id)
        ON DELETE CASCADE
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
    notes TEXT,

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

CREATE TABLE IF NOT EXISTS ActualRoutine (
    id INTEGER PRIMARY KEY,
    start_timestamp INTEGER NOT NULL,
    finish_timestamp INTEGER NOT NULL,
    routine_id INTEGER NOT NULL,
    latitude REAL,
    longitude REAL,

    CHECK (finish_timestamp >= start_timestamp),
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

INSERT OR IGNORE INTO MuscleGroup (id, name) VALUES 
    (1, 'Chest'),
    (2, 'Back'),
    (3, 'Legs'),
    (4, 'Shoulders'),
    (5, 'Arms'),
    (6, 'Core'),
    (7, 'Other');

INSERT OR IGNORE INTO RepUnit (id, name_singular, name_plural) VALUES 
    (1, 'Rep', 'Reps'),
    (2, 'Sec', 'Secs');

INSERT OR IGNORE INTO GymEquipment (id, name) VALUES 
    (1, 'Pull-up Bar'),
    (2, 'Parallel Bars'),
    (3, 'Stall Bars'),
    (4, 'Horizontal Ladder'),
    (5, 'Gymnastic Rings'),
    (6, 'Ab Bench'),
    (7, 'Dip Bars'),
    (8, 'Push-up Board'),
    (9, 'Trapeze Bar'),
    (10, 'Climbing Rope');
