import 'package:flutter/material.dart';
import '../models.dart';
import '../api_service.dart';
import 'active_workout_screen.dart';

class RoutinesScreen extends StatefulWidget {
  final List<Routine> routines;
  final List<Exercise> exercises;
  final bool isLoading;
  final VoidCallback onRefresh;
  final ApiService apiService;

  const RoutinesScreen({
    super.key,
    required this.routines,
    required this.exercises,
    required this.isLoading,
    required this.onRefresh,
    required this.apiService,
  });

  @override
  State<RoutinesScreen> createState() => _RoutinesScreenState();
}

class _RoutinesScreenState extends State<RoutinesScreen> {
  void _navigateToCreateRoutine(BuildContext context) {
    if (widget.exercises.isEmpty) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: const Color(0xFF1E1E2F),
          title: const Text('No Exercises Available', style: TextStyle(color: Colors.white)),
          content: const Text(
            'To create a routine, you must first define at least one exercise in the Exercise Library.',
            style: TextStyle(color: Colors.white70),
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.tealAccent),
              child: const Text('OK', style: TextStyle(color: Colors.black)),
            ),
          ],
        ),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => RoutineCreatorPage(
          exercises: widget.exercises,
          apiService: widget.apiService,
          onSuccess: () {
            widget.onRefresh();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Routine successfully created!'),
                backgroundColor: Colors.teal,
              ),
            );
          },
        ),
      ),
    );
  }

  void _confirmDeleteRoutine(BuildContext context, Routine routine) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E2F),
        title: const Text('Delete Routine', style: TextStyle(color: Colors.white)),
        content: Text(
          'Are you sure you want to delete "${routine.name}"? This will delete the routine template and its planned exercises, but will NOT delete your logged history of this routine.',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () async {
              if (routine.id != null) {
                try {
                  await widget.apiService.deleteRoutine(routine.id!);
                  widget.onRefresh();
                  if (!context.mounted) return;
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Routine "${routine.name}" deleted.'),
                      backgroundColor: Colors.teal,
                    ),
                  );
                } catch (e) {
                  if (!context.mounted) return;
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error deleting routine: $e'),
                      backgroundColor: Colors.redAccent,
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: widget.isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.tealAccent))
          : widget.routines.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.fitness_center_outlined, size: 64, color: Colors.grey[700]),
                      const SizedBox(height: 16),
                      const Text(
                        'No routines defined',
                        style: TextStyle(
                          color: Colors.grey,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton.icon(
                        onPressed: () => _navigateToCreateRoutine(context),
                        icon: const Icon(Icons.add, color: Colors.black),
                        label: const Text('Create your first routine', style: TextStyle(color: Colors.black)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.tealAccent,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  itemCount: widget.routines.length,
                  itemBuilder: (context, index) {
                    final routine = widget.routines[index];
                    return _buildRoutineCard(context, routine);
                  },
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _navigateToCreateRoutine(context),
        backgroundColor: Colors.tealAccent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        icon: const Icon(Icons.add, color: Colors.black),
        label: const Text('Create Routine', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildRoutineCard(BuildContext context, Routine routine) {
    return Card(
      color: const Color(0xFF1E293B),
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: ExpansionTile(
        collapsedIconColor: Colors.white70,
        iconColor: Colors.tealAccent,
        title: Text(
          routine.name,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Text(
          routine.description.isNotEmpty ? routine.description : 'No description provided.',
          style: TextStyle(
            color: Colors.grey[400],
            fontSize: 13,
          ),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16, top: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Divider(color: Colors.white10),
                const SizedBox(height: 8),
                const Text(
                  'EXERCISES & PLAN:',
                  style: TextStyle(
                    color: Colors.grey,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 8),
                if (routine.plannedExercises.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Text(
                      'No planned exercises in this template.',
                      style: TextStyle(color: Colors.white54, fontSize: 13, fontStyle: FontStyle.italic),
                    ),
                  )
                else
                  ...routine.plannedExercises.map((pe) {
                    final exerciseName = pe.exercise?.name ?? 'Deleted Exercise';
                    final restTimeText = pe.restTime != null ? '${pe.restTime}s rest' : 'no rest timer';
                    final setsText = '${pe.plannedSetInfos.length} sets';
                    final repsPattern = pe.plannedSetInfos.map((e) => '${e.reps} reps').join(' / ');

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.tealAccent.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.circle, color: Colors.tealAccent, size: 8),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  exerciseName,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '$setsText ($repsPattern) • $restTimeText',
                                  style: TextStyle(
                                    color: Colors.grey[400],
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton.icon(
                      onPressed: () => _confirmDeleteRoutine(context, routine),
                      icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 18),
                      label: const Text('Delete', style: TextStyle(color: Colors.redAccent)),
                    ),
                    ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ActiveWorkoutScreen(
                              routine: routine,
                              apiService: widget.apiService,
                              onWorkoutFinished: () {
                                widget.onRefresh();
                              },
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.play_arrow_rounded, color: Colors.black, size: 20),
                      label: const Text(
                        'Start Workout',
                        style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.tealAccent,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}

// Full page Routine Creator
class RoutineCreatorPage extends StatefulWidget {
  final List<Exercise> exercises;
  final ApiService apiService;
  final VoidCallback onSuccess;

  const RoutineCreatorPage({
    super.key,
    required this.exercises,
    required this.apiService,
    required this.onSuccess,
  });

  @override
  State<RoutineCreatorPage> createState() => _RoutineCreatorPageState();
}

class _RoutineCreatorPageState extends State<RoutineCreatorPage> {
  final _formKey = GlobalKey<FormState>();
  String _routineName = '';
  String _routineDesc = '';

  // List of exercises added to this routine
  final List<PlannedExerciseBuilder> _builders = [];

  void _addExerciseToBuilder(Exercise ex) {
    setState(() {
      _builders.add(PlannedExerciseBuilder(
        exercise: ex,
        restTime: 90,
        plannedSets: [
          PlannedSetInfoBuilder(reps: 10),
          PlannedSetInfoBuilder(reps: 10),
          PlannedSetInfoBuilder(reps: 10),
        ],
      ));
    });
  }

  void _showExercisePicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E1E2F),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return ListView.builder(
          padding: const EdgeInsets.all(20),
          itemCount: widget.exercises.length,
          itemBuilder: (context, idx) {
            final ex = widget.exercises[idx];
            return Card(
              color: const Color(0xFF2A2A3F),
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text(ex.name, style: const TextStyle(color: Colors.white)),
                subtitle: Text(ex.notes, style: const TextStyle(color: Colors.white54, fontSize: 12)),
                trailing: const Icon(Icons.add, color: Colors.tealAccent),
                onTap: () {
                  _addExerciseToBuilder(ex);
                  Navigator.pop(context);
                },
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _submitRoutine() async {
    if (!_formKey.currentState!.validate()) return;
    if (_builders.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add at least one exercise to the routine.'),
          backgroundColor: Colors.amber,
        ),
      );
      return;
    }

    _formKey.currentState!.save();

    try {
      // 1. Create Routine
      final routine = Routine(name: _routineName, description: _routineDesc);
      final routineId = await widget.apiService.createRoutine(routine);

      // 2. Create Planned Exercises with their sets
      for (var builder in _builders) {
        final pe = PlannedExercise(
          exerciseId: builder.exercise.id!,
          routineId: routineId,
          restTime: builder.restTime,
          timeUnitId: 1, // Second
          plannedSetInfos: builder.plannedSets.asMap().entries.map((entry) {
            final idx = entry.key;
            final setB = entry.value;
            return PlannedSetInfo(
              ord: idx + 1,
              reps: setB.reps,
              notes: setB.notes,
            );
          }).toList(),
        );

        await widget.apiService.createPlannedExercise(pe);
      }

      widget.onSuccess();
      if (!mounted) return;
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error creating routine: $e'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E1E2F),
        title: const Text('New Routine Template', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          TextButton(
            onPressed: _submitRoutine,
            child: const Text('Save', style: TextStyle(color: Colors.tealAccent, fontWeight: FontWeight.bold, fontSize: 16)),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // Routine details
            TextFormField(
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Routine Name *',
                labelStyle: const TextStyle(color: Colors.grey),
                filled: true,
                fillColor: const Color(0xFF1E1E2F),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
              validator: (val) => val == null || val.trim().isEmpty ? 'Enter routine name' : null,
              onSaved: (val) => _routineName = val!.trim(),
            ),
            const SizedBox(height: 16),
            TextFormField(
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Description / Goal',
                labelStyle: const TextStyle(color: Colors.grey),
                filled: true,
                fillColor: const Color(0xFF1E1E2F),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
              onSaved: (val) => _routineDesc = val?.trim() ?? '',
            ),
            const SizedBox(height: 30),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Exercises',
                  style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                ),
                OutlinedButton.icon(
                  onPressed: _showExercisePicker,
                  icon: const Icon(Icons.add, size: 18, color: Colors.tealAccent),
                  label: const Text('Add Exercise', style: TextStyle(color: Colors.tealAccent)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.tealAccent),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Builders List
            if (_builders.isEmpty)
              Container(
                padding: const EdgeInsets.all(40),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E1E2F).withOpacity(0.5),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    Icon(Icons.add_task, size: 40, color: Colors.grey[700]),
                    const SizedBox(height: 12),
                    Text(
                      'No exercises added yet.',
                      style: TextStyle(color: Colors.grey[500]),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Tap "Add Exercise" to include movements in this routine template.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    ),
                  ],
                ),
              )
            else
              ..._builders.asMap().entries.map((entry) {
                final idx = entry.key;
                final b = entry.value;

                return Card(
                  color: const Color(0xFF1E1E2F),
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Exercise Name & Remove button
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              b.exercise.name,
                              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                              onPressed: () {
                                setState(() {
                                  _builders.removeAt(idx);
                                });
                              },
                            ),
                          ],
                        ),

                        // Rest timer setup
                        Row(
                          children: [
                            const Text('Rest time: ', style: TextStyle(color: Colors.white70, fontSize: 13)),
                            const SizedBox(width: 8),
                            DropdownButton<int>(
                              dropdownColor: const Color(0xFF1E1E2F),
                              value: b.restTime,
                              items: const [
                                DropdownMenuItem(value: 30, child: Text('30s', style: TextStyle(color: Colors.white))),
                                DropdownMenuItem(value: 60, child: Text('60s', style: TextStyle(color: Colors.white))),
                                DropdownMenuItem(value: 90, child: Text('90s', style: TextStyle(color: Colors.white))),
                                DropdownMenuItem(value: 120, child: Text('120s', style: TextStyle(color: Colors.white))),
                                DropdownMenuItem(value: 150, child: Text('150s', style: TextStyle(color: Colors.white))),
                                DropdownMenuItem(value: 180, child: Text('180s', style: TextStyle(color: Colors.white))),
                              ],
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    b.restTime = val;
                                  });
                                }
                              },
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),

                        // Target Sets list
                        const Text(
                          'Target Sets:',
                          style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        ...b.plannedSets.asMap().entries.map((setEntry) {
                          final setIdx = setEntry.key;
                          final setB = setEntry.value;

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 12,
                                  backgroundColor: Colors.tealAccent.withOpacity(0.1),
                                  child: Text('${setIdx + 1}', style: const TextStyle(color: Colors.tealAccent, fontSize: 11, fontWeight: FontWeight.bold)),
                                ),
                                const SizedBox(width: 12),
                                const Text('Reps: ', style: TextStyle(color: Colors.white70, fontSize: 13)),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: SizedBox(
                                    height: 36,
                                    child: TextFormField(
                                      initialValue: '${setB.reps}',
                                      keyboardType: TextInputType.number,
                                      style: const TextStyle(color: Colors.white, fontSize: 13),
                                      decoration: InputDecoration(
                                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
                                        filled: true,
                                        fillColor: const Color(0xFF2A2A3F),
                                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                                      ),
                                      onChanged: (val) {
                                        final parsed = int.tryParse(val);
                                        if (parsed != null) {
                                          setB.reps = parsed;
                                        }
                                      },
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  flex: 2,
                                  child: SizedBox(
                                    height: 36,
                                    child: TextFormField(
                                      initialValue: setB.notes,
                                      style: const TextStyle(color: Colors.white, fontSize: 13),
                                      decoration: InputDecoration(
                                        hintText: 'Notes',
                                        hintStyle: const TextStyle(color: Colors.grey, fontSize: 12),
                                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
                                        filled: true,
                                        fillColor: const Color(0xFF2A2A3F),
                                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                                      ),
                                      onChanged: (val) {
                                        setB.notes = val;
                                      },
                                    ),
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.remove_circle_outline, color: Colors.white30, size: 20),
                                  onPressed: () {
                                    setState(() {
                                      b.plannedSets.removeAt(setIdx);
                                    });
                                  },
                                ),
                              ],
                            ),
                          );
                        }),
                        const SizedBox(height: 6),
                        TextButton.icon(
                          onPressed: () {
                            setState(() {
                              b.plannedSets.add(PlannedSetInfoBuilder(reps: 10));
                            });
                          },
                          icon: const Icon(Icons.add, size: 16, color: Colors.tealAccent),
                          label: const Text('Add Set', style: TextStyle(color: Colors.tealAccent, fontSize: 12)),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }
}

// Temporary builder classes for UI state management
class PlannedExerciseBuilder {
  final Exercise exercise;
  int restTime;
  List<PlannedSetInfoBuilder> plannedSets;

  PlannedExerciseBuilder({
    required this.exercise,
    this.restTime = 90,
    required this.plannedSets,
  });
}

class PlannedSetInfoBuilder {
  int reps;
  String notes;

  PlannedSetInfoBuilder({
    required this.reps,
    this.notes = '',
  });
}
