class Exercise {
  final int? id;
  final String name;
  final String notes;
  final String instructions;
  final int? imageId;

  Exercise({
    this.id,
    required this.name,
    this.notes = '',
    this.instructions = '',
    this.imageId,
  });

  factory Exercise.fromJson(Map<String, dynamic> json) {
    return Exercise(
      id: json['ID'] as int?,
      name: json['Name'] as String? ?? '',
      notes: json['Notes'] as String? ?? '',
      instructions: json['Instructions'] as String? ?? '',
      imageId: json['ImageID'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'name': name,
      'notes': notes,
      'instructions': instructions,
      'image_id': imageId,
    };
  }

  @override
  String toString() => 'Exercise(id: $id, name: $name)';
}

class PlannedExercise {
  final int? id;
  final int? restTime;
  final int? timeUnitId;
  final int exerciseId;
  final int routineId;

  // Frontend helper objects (populated async)
  Exercise? exercise;
  List<PlannedSetInfo> plannedSetInfos;

  PlannedExercise({
    this.id,
    this.restTime,
    this.timeUnitId,
    required this.exerciseId,
    required this.routineId,
    this.exercise,
    this.plannedSetInfos = const [],
  });

  factory PlannedExercise.fromJson(Map<String, dynamic> json) {
    return PlannedExercise(
      id: json['ID'] as int?,
      restTime: json['RestTime'] as int?,
      timeUnitId: json['TimeUnitID'] as int?,
      exerciseId: json['ExerciseID'] as int? ?? 0,
      routineId: json['RoutineID'] as int? ?? 0,
      plannedSetInfos: [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'rest_time': restTime,
      'time_unit_id': timeUnitId,
      'exercise_id': exerciseId,
      'routine_id': routineId,
      'planned_set_infos': plannedSetInfos.map((e) => e.toJson()).toList(),
    };
  }
}

class PlannedSetInfo {
  final int? id;
  final int ord;
  final int? plannedExerciseId;
  final int reps;
  final String notes;

  PlannedSetInfo({
    this.id,
    required this.ord,
    this.plannedExerciseId,
    required this.reps,
    this.notes = '',
  });

  factory PlannedSetInfo.fromJson(Map<String, dynamic> json) {
    return PlannedSetInfo(
      id: json['ID'] as int?,
      ord: json['Ord'] as int? ?? 0,
      plannedExerciseId: json['PlannedExerciseID'] as int?,
      reps: json['Reps'] as int? ?? 0,
      notes: json['Notes'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'ord': ord,
      if (plannedExerciseId != null) 'planned_exercise_id': plannedExerciseId,
      'reps': reps,
      'notes': notes,
    };
  }
}

class Routine {
  final int? id;
  final String name;
  final String description;
  final int? imageId;

  // Frontend helper object
  List<PlannedExercise> plannedExercises;

  Routine({
    this.id,
    required this.name,
    this.description = '',
    this.imageId,
    this.plannedExercises = const [],
  });

  factory Routine.fromJson(Map<String, dynamic> json) {
    return Routine(
      id: json['ID'] as int?,
      name: json['Name'] as String? ?? '',
      description: json['Description'] as String? ?? '',
      imageId: json['ImageID'] as int?,
      plannedExercises: [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'name': name,
      'description': description,
      'image_id': imageId,
    };
  }
}

class RoutineInstance {
  final int? id;
  final int finishTimestamp;
  final int routineId;

  // Frontend helpers
  String? routineName;
  List<ActualSetInfo> actualSetInfos;

  RoutineInstance({
    this.id,
    required this.finishTimestamp,
    required this.routineId,
    this.routineName,
    this.actualSetInfos = const [],
  });

  factory RoutineInstance.fromJson(Map<String, dynamic> json) {
    return RoutineInstance(
      id: json['ID'] as int?,
      finishTimestamp: json['FinishTimestamp'] as int? ?? 0,
      routineId: json['RoutineID'] as int? ?? 0,
      actualSetInfos: [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'routine_id': routineId,
      'actual_set_infos': actualSetInfos.map((e) => e.toJson()).toList(),
    };
  }
}

class ActualSetInfo {
  final int? id;
  final double weight;
  final int? routineInstanceId;
  final int plannedSetInfoId;
  final int actualReps;

  // Frontend helper
  PlannedSetInfo? plannedSetInfo;
  String? exerciseName;

  ActualSetInfo({
    this.id,
    required this.weight,
    this.routineInstanceId,
    required this.plannedSetInfoId,
    required this.actualReps,
    this.plannedSetInfo,
    this.exerciseName,
  });

  factory ActualSetInfo.fromJson(Map<String, dynamic> json) {
    return ActualSetInfo(
      id: json['ID'] as int?,
      weight: (json['Weight'] as num? ?? 0.0).toDouble(),
      routineInstanceId: json['RoutineInstanceID'] as int?,
      plannedSetInfoId: json['PlannedSetInfoID'] as int? ?? 0,
      actualReps: json['ActualReps'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'weight': weight,
      'planned_set_info_id': plannedSetInfoId,
      'actual_reps': actualReps,
    };
  }
}
