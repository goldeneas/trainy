import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'models.dart';

class ApiService {
  late String baseUrl;

  ApiService({String? baseUrl}) {
    this.baseUrl = baseUrl ?? defaultBaseUrl;
  }

  static String get defaultBaseUrl {
    // Detect android emulator
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:8080';
    }
    return 'http://localhost:8080';
  }

  // Exercise API
  Future<List<Exercise>> getExercises() async {
    final response = await http.get(Uri.parse('$baseUrl/v1/exercise'));
    if (response.statusCode == 200) {
      final List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => Exercise.fromJson(item as Map<String, dynamic>)).toList();
    } else {
      throw Exception('Failed to load exercises: ${response.body}');
    }
  }

  Future<int> createExercise(Exercise exercise) async {
    final response = await http.post(
      Uri.parse('$baseUrl/v1/exercise'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(exercise.toJson()),
    );
    if (response.statusCode == 201) {
      return int.parse(response.body);
    } else {
      throw Exception('Failed to create exercise: ${response.body}');
    }
  }

  Future<void> deleteExercise(int id) async {
    final response = await http.delete(Uri.parse('$baseUrl/v1/exercise/$id'));
    if (response.statusCode != 200) {
      throw Exception('Failed to delete exercise: ${response.body}');
    }
  }

  // Planned Exercise API
  Future<List<PlannedExercise>> getPlannedExercises() async {
    final response = await http.get(Uri.parse('$baseUrl/v1/exercise/instance'));
    if (response.statusCode == 200) {
      final List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => PlannedExercise.fromJson(item as Map<String, dynamic>)).toList();
    } else {
      throw Exception('Failed to load planned exercises: ${response.body}');
    }
  }

  Future<int> createPlannedExercise(PlannedExercise plannedExercise) async {
    final response = await http.post(
      Uri.parse('$baseUrl/v1/exercise/instance'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(plannedExercise.toJson()),
    );
    if (response.statusCode == 201) {
      return int.parse(response.body);
    } else {
      throw Exception('Failed to create planned exercise: ${response.body}');
    }
  }

  Future<List<PlannedSetInfo>> getPlannedSetInfos(int plannedExerciseId) async {
    final response = await http.get(Uri.parse('$baseUrl/v1/exercise/instance/$plannedExerciseId/set_info'));
    if (response.statusCode == 200) {
      final List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => PlannedSetInfo.fromJson(item as Map<String, dynamic>)).toList();
    } else {
      throw Exception('Failed to load planned set infos: ${response.body}');
    }
  }

  Future<void> deletePlannedExercise(int id) async {
    final response = await http.delete(Uri.parse('$baseUrl/v1/exercise/instance/$id'));
    if (response.statusCode != 200) {
      throw Exception('Failed to delete planned exercise: ${response.body}');
    }
  }

  // Routine API
  Future<List<Routine>> getRoutines() async {
    final response = await http.get(Uri.parse('$baseUrl/v1/routine'));
    if (response.statusCode == 200) {
      final List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => Routine.fromJson(item as Map<String, dynamic>)).toList();
    } else {
      throw Exception('Failed to load routines: ${response.body}');
    }
  }

  Future<Routine> getRoutineById(int id) async {
    final response = await http.get(Uri.parse('$baseUrl/v1/routine/$id'));
    if (response.statusCode == 200) {
      return Routine.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    } else {
      throw Exception('Failed to load routine: ${response.body}');
    }
  }

  Future<int> createRoutine(Routine routine) async {
    final response = await http.post(
      Uri.parse('$baseUrl/v1/routine'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(routine.toJson()),
    );
    if (response.statusCode == 201) {
      return int.parse(response.body);
    } else {
      throw Exception('Failed to create routine: ${response.body}');
    }
  }

  Future<void> deleteRoutine(int id) async {
    final response = await http.delete(Uri.parse('$baseUrl/v1/routine/$id'));
    if (response.statusCode != 200) {
      throw Exception('Failed to delete routine: ${response.body}');
    }
  }

  // Routine Instance API
  Future<List<RoutineInstance>> getRoutineInstances() async {
    final response = await http.get(Uri.parse('$baseUrl/v1/routine/instance'));
    if (response.statusCode == 200) {
      final List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => RoutineInstance.fromJson(item as Map<String, dynamic>)).toList();
    } else {
      throw Exception('Failed to load routine instances: ${response.body}');
    }
  }

  Future<List<ActualSetInfo>> getActualSetInfos(int routineInstanceId) async {
    final response = await http.get(Uri.parse('$baseUrl/v1/routine/instance/$routineInstanceId/set_info'));
    if (response.statusCode == 200) {
      final List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => ActualSetInfo.fromJson(item as Map<String, dynamic>)).toList();
    } else {
      throw Exception('Failed to load actual set infos: ${response.body}');
    }
  }

  Future<int> createRoutineInstance(RoutineInstance instance) async {
    final response = await http.post(
      Uri.parse('$baseUrl/v1/routine/instance'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(instance.toJson()),
    );
    if (response.statusCode == 201) {
      return int.parse(response.body);
    } else {
      throw Exception('Failed to log routine instance: ${response.body}');
    }
  }

  Future<void> deleteRoutineInstance(int id) async {
    final response = await http.delete(Uri.parse('$baseUrl/v1/routine/instance/$id'));
    if (response.statusCode != 200) {
      throw Exception('Failed to delete routine instance: ${response.body}');
    }
  }

  // --- Stitched data methods to make UI development much easier ---

  Future<List<Routine>> getFullRoutines() async {
    final routines = await getRoutines();
    final allPlannedEx = await getPlannedExercises();
    final exercises = await getExercises();

    final exerciseMap = {for (var e in exercises) e.id: e};

    for (var routine in routines) {
      final routinePlannedEx = allPlannedEx.where((pe) => pe.routineId == routine.id).toList();
      for (var pe in routinePlannedEx) {
        pe.exercise = exerciseMap[pe.exerciseId];
        if (pe.id != null) {
          pe.plannedSetInfos = await getPlannedSetInfos(pe.id!);
          pe.plannedSetInfos.sort((a, b) => a.ord.compareTo(b.ord));
        }
      }
      routine.plannedExercises = routinePlannedEx;
    }
    return routines;
  }

  Future<List<RoutineInstance>> getFullRoutineInstances() async {
    final instances = await getRoutineInstances();
    final routines = await getRoutines();
    final exercises = await getExercises();
    final allPlannedEx = await getPlannedExercises();

    final routineMap = {for (var r in routines) r.id: r};
    final exerciseMap = {for (var e in exercises) e.id: e};

    // Gather all planned set infos so we can map actual sets back to their target reps
    final Map<int, PlannedSetInfo> setInfoMap = {};
    for (var pe in allPlannedEx) {
      if (pe.id != null) {
        final infos = await getPlannedSetInfos(pe.id!);
        for (var info in infos) {
          if (info.id != null) {
            setInfoMap[info.id!] = info;
          }
        }
      }
    }

    final plannedExMap = {for (var pe in allPlannedEx) pe.id: pe};

    for (var inst in instances) {
      inst.routineName = routineMap[inst.routineId]?.name ?? 'Deleted Routine';
      if (inst.id != null) {
        final actualSets = await getActualSetInfos(inst.id!);
        for (var actualSet in actualSets) {
          final planSet = setInfoMap[actualSet.plannedSetInfoId];
          actualSet.plannedSetInfo = planSet;
          if (planSet != null) {
            final pe = plannedExMap[planSet.plannedExerciseId];
            actualSet.exerciseName = exerciseMap[pe?.exerciseId]?.name;
          }
        }
        inst.actualSetInfos = actualSets;
      }
    }

    // Sort by finish timestamp descending
    instances.sort((a, b) => b.finishTimestamp.compareTo(a.finishTimestamp));
    return instances;
  }

  // Prepopulate standard data for a rich first-use experience
  Future<void> seedDefaultData() async {
    // 1. Check if we already have exercises
    final existingEx = await getExercises();
    if (existingEx.isNotEmpty) return; // DB already has data

    // 2. Create exercises
    final pushupsId = await createExercise(Exercise(
      name: 'Pushups',
      notes: 'Bodyweight chest exercise',
      instructions: 'Keep core tight, lower your chest until it almost touches the floor, and push back up.',
    ));
    final squatsId = await createExercise(Exercise(
      name: 'Squats',
      notes: 'Leg foundation exercise',
      instructions: 'Stand with feet shoulder-width apart, lower hips back and down, keep chest up, push back to start.',
    ));
    final pullupsId = await createExercise(Exercise(
      name: 'Pullups',
      notes: 'Upper back builder',
      instructions: 'Hang from bar, pull chest to bar, lower slowly under control.',
    ));
    final benchPressId = await createExercise(Exercise(
      name: 'Bench Press',
      notes: 'Horizontal push exercise',
      instructions: 'Lie on bench, lower bar to mid-chest, push bar back up until arms are straight.',
    ));
    final deadliftId = await createExercise(Exercise(
      name: 'Deadlift',
      notes: 'Full body builder',
      instructions: 'Keep back flat, bar close to shins, stand up by pushing through heels and driving hips forward.',
    ));

    // 3. Create routines
    final pushRoutineId = await createRoutine(Routine(
      name: 'Upper Body Push',
      description: 'Focuses on Chest, Shoulders, and Triceps',
    ));
    final legsRoutineId = await createRoutine(Routine(
      name: 'Leg Day',
      description: 'Focuses on Quadriceps, Hamstrings, and Glutes',
    ));
    final pullRoutineId = await createRoutine(Routine(
      name: 'Back & Core Pull',
      description: 'Focuses on Upper Back, Biceps, and Abs',
    ));

    // 4. Create Planned Exercises with sets
    // Push routine planned exercises
    await createPlannedExercise(PlannedExercise(
      exerciseId: benchPressId,
      routineId: pushRoutineId,
      restTime: 90,
      plannedSetInfos: [
        PlannedSetInfo(ord: 1, reps: 10, notes: 'Warm up'),
        PlannedSetInfo(ord: 2, reps: 8, notes: 'Working set'),
        PlannedSetInfo(ord: 3, reps: 6, notes: 'Heavy set'),
      ],
    ));
    await createPlannedExercise(PlannedExercise(
      exerciseId: pushupsId,
      routineId: pushRoutineId,
      restTime: 60,
      plannedSetInfos: [
        PlannedSetInfo(ord: 1, reps: 15, notes: 'Burnout set'),
        PlannedSetInfo(ord: 2, reps: 12, notes: 'To failure'),
      ],
    ));

    // Legs routine planned exercises
    await createPlannedExercise(PlannedExercise(
      exerciseId: squatsId,
      routineId: legsRoutineId,
      restTime: 120,
      plannedSetInfos: [
        PlannedSetInfo(ord: 1, reps: 12, notes: 'Focus on depth'),
        PlannedSetInfo(ord: 2, reps: 10, notes: 'Increase weight'),
        PlannedSetInfo(ord: 3, reps: 8, notes: 'Max effort'),
      ],
    ));

    // Pull routine planned exercises
    await createPlannedExercise(PlannedExercise(
      exerciseId: pullupsId,
      routineId: pullRoutineId,
      restTime: 90,
      plannedSetInfos: [
        PlannedSetInfo(ord: 1, reps: 8, notes: 'Strict form'),
        PlannedSetInfo(ord: 2, reps: 8, notes: 'Strict form'),
        PlannedSetInfo(ord: 3, reps: 6, notes: 'Slow negatives'),
      ],
    ));
    await createPlannedExercise(PlannedExercise(
      exerciseId: deadliftId,
      routineId: pullRoutineId,
      restTime: 180,
      plannedSetInfos: [
        PlannedSetInfo(ord: 1, reps: 5, notes: 'Power builder'),
        PlannedSetInfo(ord: 2, reps: 5, notes: 'Power builder'),
      ],
    ));
  }
}
