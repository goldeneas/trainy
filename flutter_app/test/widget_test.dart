import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_app/models.dart';

void main() {
  group('Trainy Models Serialization Tests', () {
    test('Exercise model mapping', () {
      final json = {
        'ID': 12,
        'Name': 'Bench Press',
        'Notes': 'Keep elbows tucked',
        'Instructions': 'Lower slowly to chest and push up.',
        'ImageID': null,
      };

      final exercise = Exercise.fromJson(json);

      expect(exercise.id, 12);
      expect(exercise.name, 'Bench Press');
      expect(exercise.notes, 'Keep elbows tucked');
      expect(exercise.instructions, 'Lower slowly to chest and push up.');
      expect(exercise.imageId, isNull);

      final outJson = exercise.toJson();
      expect(outJson['id'], 12);
      expect(outJson['name'], 'Bench Press');
      expect(outJson['notes'], 'Keep elbows tucked');
      expect(outJson['instructions'], 'Lower slowly to chest and push up.');
    });

    test('Routine model mapping', () {
      final json = {
        'ID': 5,
        'Name': 'Leg Day',
        'Description': 'Quads and calves focus',
        'ImageID': 2,
      };

      final routine = Routine.fromJson(json);

      expect(routine.id, 5);
      expect(routine.name, 'Leg Day');
      expect(routine.description, 'Quads and calves focus');
      expect(routine.imageId, 2);

      final outJson = routine.toJson();
      expect(outJson['id'], 5);
      expect(outJson['name'], 'Leg Day');
      expect(outJson['description'], 'Quads and calves focus');
      expect(outJson['image_id'], 2);
    });

    test('PlannedSetInfo model mapping', () {
      final json = {
        'ID': 100,
        'Ord': 2,
        'PlannedExerciseID': 45,
        'Reps': 12,
        'Notes': 'Go heavy',
      };

      final info = PlannedSetInfo.fromJson(json);

      expect(info.id, 100);
      expect(info.ord, 2);
      expect(info.plannedExerciseId, 45);
      expect(info.reps, 12);
      expect(info.notes, 'Go heavy');

      final outJson = info.toJson();
      expect(outJson['ord'], 2);
      expect(outJson['planned_exercise_id'], 45);
      expect(outJson['reps'], 12);
      expect(outJson['notes'], 'Go heavy');
    });

    test('ActualSetInfo model mapping', () {
      final json = {
        'ID': 200,
        'Weight': 82.5,
        'RoutineInstanceID': 8,
        'PlannedSetInfoID': 100,
        'ActualReps': 10,
      };

      final actual = ActualSetInfo.fromJson(json);

      expect(actual.id, 200);
      expect(actual.weight, 82.5);
      expect(actual.routineInstanceId, 8);
      expect(actual.plannedSetInfoId, 100);
      expect(actual.actualReps, 10);

      final outJson = actual.toJson();
      expect(outJson['weight'], 82.5);
      expect(outJson['planned_set_info_id'], 100);
      expect(outJson['actual_reps'], 10);
    });
  });
}
