import 'dart:async';
import 'package:flutter/material.dart';
import '../models.dart';
import '../api_service.dart';

class ActiveWorkoutScreen extends StatefulWidget {
  final Routine routine;
  final ApiService apiService;
  final VoidCallback onWorkoutFinished;

  const ActiveWorkoutScreen({
    super.key,
    required this.routine,
    required this.apiService,
    required this.onWorkoutFinished,
  });

  @override
  State<ActiveWorkoutScreen> createState() => _ActiveWorkoutScreenState();
}

class _ActiveWorkoutScreenState extends State<ActiveWorkoutScreen> {
  // Workout timer variables
  late Timer _workoutTimer;
  int _secondsElapsed = 0;

  // Rest timer variables
  Timer? _restTimer;
  int _restSecondsRemaining = 0;
  int _restSecondsDuration = 0;
  String _currentRestingExercise = '';

  // Local state representing the current log progress
  final List<ActiveExerciseState> _exerciseStates = [];

  @override
  void initState() {
    super.initState();
    // Initialize the workout timer
    _workoutTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _secondsElapsed++;
      });
    });

    // Initialize local state from the routine template
    for (var pe in widget.routine.plannedExercises) {
      final List<ActiveSetState> setStates = [];
      for (var info in pe.plannedSetInfos) {
        setStates.add(ActiveSetState(
          plannedSetInfo: info,
          weightController: TextEditingController(),
          repsController: TextEditingController(text: '${info.reps}'),
        ));
      }
      _exerciseStates.add(ActiveExerciseState(
        plannedExercise: pe,
        setStates: setStates,
      ));
    }
  }

  @override
  void dispose() {
    _workoutTimer.cancel();
    _restTimer?.cancel();
    for (var exState in _exerciseStates) {
      for (var sState in exState.setStates) {
        sState.weightController.dispose();
        sState.repsController.dispose();
      }
    }
    super.dispose();
  }

  String _formatDuration(int totalSeconds) {
    final int hours = totalSeconds ~/ 3600;
    final int minutes = (totalSeconds % 3600) ~/ 60;
    final int seconds = totalSeconds % 60;
    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  void _startRestTimer(int seconds, String exerciseName) {
    _restTimer?.cancel();
    setState(() {
      _restSecondsDuration = seconds;
      _restSecondsRemaining = seconds;
      _currentRestingExercise = exerciseName;
    });

    _restTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_restSecondsRemaining <= 1) {
        _restTimer?.cancel();
        setState(() {
          _restSecondsRemaining = 0;
        });
        // Feedback
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Rest finished! Time for your next set of $exerciseName.'),
            backgroundColor: Colors.tealAccent,
            duration: const Duration(seconds: 3),
          ),
        );
      } else {
        setState(() {
          _restSecondsRemaining--;
        });
      }
    });
  }

  void _addSetToExercise(ActiveExerciseState exState) {
    setState(() {
      // Calculate order
      final nextOrd = exState.setStates.length + 1;
      // Get reference reps from previous set, or default to 10
      final refReps = exState.setStates.isNotEmpty
          ? int.tryParse(exState.setStates.last.repsController.text) ?? 10
          : 10;
      final refWeight = exState.setStates.isNotEmpty
          ? exState.setStates.last.weightController.text
          : '';

      // Create a temporary PlannedSetInfo. Note: we might not have a backend ID for this,
      // but when submitting, we should look up if we can find a matching planned set or just map it.
      // Wait! If the user adds a set during workout, it's not a template set.
      // But the backend table ActualSetInfo has a foreign key to PlannedSetInfo:
      // set_info_id INTEGER NOT NULL.
      // So every actual set MUST map to a PlannedSetInfo ID!
      // This is a constraint in database.sql:
      // FOREIGN KEY (set_info_id) REFERENCES PlannedSetInfo(id)
      // Wait! If the user adds a set that wasn't in the template, we don't have a PlannedSetInfo.
      // To work around this constraint, we can just use the PlannedSetInfo ID of the LAST template set
      // of that exercise, or show a notice that they are limited to the template sets.
      // Wait, let's look at `database.sql`:
      // `FOREIGN KEY (set_info_id) REFERENCES PlannedSetInfo(id)`
      // Yes, it is NOT NULL. So we MUST map it to an existing PlannedSetInfo.
      // Let's use the ID of the last template set of this exercise as the `plannedSetInfoId`
      // if they exceed the template sets. That is a very safe fallback!
      final lastInfoId = exState.plannedExercise.plannedSetInfos.last.id;

      exState.setStates.add(ActiveSetState(
        plannedSetInfo: PlannedSetInfo(
          id: lastInfoId, // Reuse last info id
          ord: nextOrd,
          reps: refReps,
        ),
        weightController: TextEditingController(text: refWeight),
        repsController: TextEditingController(text: '$refReps'),
      ));
    });
  }

  void _removeSetFromExercise(ActiveExerciseState exState, int index) {
    if (exState.setStates.length <= 1) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('An exercise must have at least one set.'),
          backgroundColor: Colors.amber,
        ),
      );
      return;
    }
    setState(() {
      exState.setStates[index].weightController.dispose();
      exState.setStates[index].repsController.dispose();
      exState.setStates.removeAt(index);
    });
  }

  Future<void> _finishWorkout() async {
    // 1. Collect completed (checked) sets
    final List<ActualSetInfo> completedSets = [];
    int totalCompletedSets = 0;
    double totalWeightLifted = 0;

    for (var exState in _exerciseStates) {
      for (var sState in exState.setStates) {
        if (sState.isCompleted) {
          final double weight = double.tryParse(sState.weightController.text) ?? 0.0;
          final int actualReps = int.tryParse(sState.repsController.text) ?? sState.plannedSetInfo.reps;
          final int setInfoId = sState.plannedSetInfo.id ?? 0;

          if (setInfoId == 0) {
            // Should not happen as we seeded or retrieved them correctly
            continue;
          }

          completedSets.add(ActualSetInfo(
            weight: weight,
            plannedSetInfoId: setInfoId,
            actualReps: actualReps,
          ));

          totalWeightLifted += (weight * actualReps);
          totalCompletedSets++;
        }
      }
    }

    if (completedSets.isEmpty) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: const Color(0xFF1E1E2F),
          title: const Text('Empty Workout', style: TextStyle(color: Colors.white)),
          content: const Text(
            'You haven\'t completed (checked) any sets yet. Tap the checkbox on a set to mark it completed.',
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

    // 2. Submit to Backend
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(color: Colors.tealAccent),
      ),
    );

    try {
      final instance = RoutineInstance(
        finishTimestamp: DateTime.now().millisecondsSinceEpoch ~/ 1000,
        routineId: widget.routine.id!,
        actualSetInfos: completedSets,
      );

      await widget.apiService.createRoutineInstance(instance);

      // Dismiss loading indicator
      if (mounted) Navigator.pop(context);

      // Stop timers
      _workoutTimer.cancel();
      _restTimer?.cancel();

      // Show summary success overlay
      _showWorkoutCompleteSummary(totalCompletedSets, totalWeightLifted);
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Dismiss loading
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error saving workout: $e'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  void _showWorkoutCompleteSummary(int completedSetsCount, double totalVolume) {
    showGeneralDialog(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black.withOpacity(0.85),
      transitionDuration: const Duration(milliseconds: 350),
      pageBuilder: (context, anim1, anim2) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Center(
            child: Container(
              width: MediaQuery.of(context).size.width * 0.85,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFF1E1E2F),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.tealAccent.withOpacity(0.2)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.tealAccent.withOpacity(0.1),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.tealAccent.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.emoji_events,
                      color: Colors.tealAccent,
                      size: 64,
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Workout Complete!',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Congratulations! You crushed your "${widget.routine.name}" workout.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                  const SizedBox(height: 24),
                  const Divider(color: Colors.white10),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildSummaryStat('Duration', _formatDuration(_secondsElapsed)),
                      _buildSummaryStat('Sets Completed', '$completedSetsCount'),
                      _buildSummaryStat('Volume Lifted', '${totalVolume.toStringAsFixed(1)} kg'),
                    ],
                  ),
                  const SizedBox(height: 30),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context); // Close dialog
                        Navigator.pop(context); // Pop workout screen
                        widget.onWorkoutFinished(); // Reload parent
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.tealAccent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Awesome, back to dashboard',
                        style: TextStyle(
                          color: Colors.black,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildSummaryStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.tealAccent,
            fontSize: 18,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            color: Colors.grey,
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1A),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: const Color(0xFF1E1E2F),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.routine.name,
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 2),
            Text(
              'Active tracking...',
              style: TextStyle(color: Colors.grey[400], fontSize: 11, fontWeight: FontWeight.normal),
            ),
          ],
        ),
        actions: [
          Container(
            alignment: Alignment.center,
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.tealAccent.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                const Icon(Icons.timer_outlined, color: Colors.tealAccent, size: 16),
                const SizedBox(width: 6),
                Text(
                  _formatDuration(_secondsElapsed),
                  style: const TextStyle(color: Colors.tealAccent, fontSize: 14, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: _finishWorkout,
            child: const Text('Finish', style: TextStyle(color: Colors.tealAccent, fontWeight: FontWeight.bold, fontSize: 16)),
          ),
        ],
      ),
      body: Stack(
        children: [
          ListView.builder(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: _restSecondsRemaining > 0 ? 160 : 100,
            ),
            itemCount: _exerciseStates.length,
            itemBuilder: (context, idx) {
              final exState = _exerciseStates[idx];
              final exerciseName = exState.plannedExercise.exercise?.name ?? 'Exercise';
              final instructions = exState.plannedExercise.exercise?.instructions ?? '';

              return Card(
                color: const Color(0xFF1E1E2F),
                margin: const EdgeInsets.only(bottom: 24),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Exercise header info
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  exerciseName,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                if (instructions.isNotEmpty) ...[
                                  const SizedBox(height: 2),
                                  InkWell(
                                    onTap: () {
                                      showDialog(
                                        context: context,
                                        builder: (context) => AlertDialog(
                                          backgroundColor: const Color(0xFF1E1E2F),
                                          title: Text(exerciseName, style: const TextStyle(color: Colors.white)),
                                          content: Text(instructions, style: const TextStyle(color: Colors.white70)),
                                          actions: [
                                            TextButton(
                                              onPressed: () => Navigator.pop(context),
                                              child: const Text('Close', style: TextStyle(color: Colors.tealAccent)),
                                            )
                                          ],
                                        ),
                                      );
                                    },
                                    child: const Text(
                                      'View instructions',
                                      style: TextStyle(
                                        color: Colors.tealAccent,
                                        fontSize: 12,
                                        decoration: TextDecoration.underline,
                                      ),
                                    ),
                                  )
                                ],
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.add, color: Colors.tealAccent, size: 20),
                            onPressed: () => _addSetToExercise(exState),
                            tooltip: 'Add set',
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Set table header
                      const Row(
                        children: [
                          Expanded(
                            flex: 1,
                            child: Text('SET', style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                          Expanded(
                            flex: 2,
                            child: Text('WEIGHT (kg)', style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                          Expanded(
                            flex: 2,
                            child: Text('REPS', style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                          SizedBox(width: 48), // Space matching the actions
                        ],
                      ),
                      const SizedBox(height: 8),

                      // Set rows
                      ...exState.setStates.asMap().entries.map((setEntry) {
                        final setIdx = setEntry.key;
                        final sState = setEntry.value;

                        return Dismissible(
                          key: UniqueKey(),
                          direction: DismissDirection.endToStart,
                          onDismissed: (_) => _removeSetFromExercise(exState, setIdx),
                          background: Container(
                            alignment: Alignment.centerRight,
                            padding: const EdgeInsets.only(right: 16),
                            decoration: BoxDecoration(
                              color: Colors.redAccent.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.delete, color: Colors.redAccent),
                          ),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            color: sState.isCompleted
                                ? Colors.tealAccent.withOpacity(0.04)
                                : Colors.transparent,
                            child: Row(
                              children: [
                                // Set index
                                Expanded(
                                  flex: 1,
                                  child: Container(
                                    alignment: Alignment.center,
                                    margin: const EdgeInsets.only(right: 12),
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: sState.isCompleted
                                          ? Colors.tealAccent.withOpacity(0.15)
                                          : Colors.white10,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      '${setIdx + 1}',
                                      style: TextStyle(
                                        color: sState.isCompleted ? Colors.tealAccent : Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ),

                                // Weight Input
                                Expanded(
                                  flex: 2,
                                  child: Container(
                                    height: 38,
                                    margin: const EdgeInsets.only(right: 8),
                                    child: TextField(
                                      controller: sState.weightController,
                                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                      style: const TextStyle(color: Colors.white, fontSize: 14),
                                      textAlign: TextAlign.center,
                                      decoration: InputDecoration(
                                        contentPadding: EdgeInsets.zero,
                                        hintText: '0.0',
                                        hintStyle: const TextStyle(color: Colors.white24),
                                        filled: true,
                                        fillColor: const Color(0xFF2A2A3F),
                                        border: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(8),
                                          borderSide: BorderSide.none,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),

                                // Reps Input
                                Expanded(
                                  flex: 2,
                                  child: Container(
                                    height: 38,
                                    margin: const EdgeInsets.only(right: 8),
                                    child: TextField(
                                      controller: sState.repsController,
                                      keyboardType: TextInputType.number,
                                      style: const TextStyle(color: Colors.white, fontSize: 14),
                                      textAlign: TextAlign.center,
                                      decoration: InputDecoration(
                                        contentPadding: EdgeInsets.zero,
                                        hintText: '${sState.plannedSetInfo.reps}',
                                        hintStyle: const TextStyle(color: Colors.white24),
                                        filled: true,
                                        fillColor: const Color(0xFF2A2A3F),
                                        border: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(8),
                                          borderSide: BorderSide.none,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),

                                // Complete Checkbox
                                Container(
                                  width: 40,
                                  height: 38,
                                  decoration: BoxDecoration(
                                    color: sState.isCompleted ? Colors.tealAccent : const Color(0xFF2A2A3F),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: InkWell(
                                    onTap: () {
                                      setState(() {
                                        sState.isCompleted = !sState.isCompleted;
                                        if (sState.isCompleted) {
                                          // Set completed, trigger rest timer
                                          final rest = exState.plannedExercise.restTime ?? 90;
                                          if (rest > 0) {
                                            _startRestTimer(rest, exerciseName);
                                          }
                                        }
                                      });
                                    },
                                    child: Icon(
                                      Icons.check,
                                      color: sState.isCompleted ? Colors.black : Colors.white24,
                                      size: 20,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              );
            },
          ),

          // Rest Timer Floating Bar (Overlay)
          if (_restSecondsRemaining > 0)
            Positioned(
              left: 20,
              right: 20,
              bottom: 24,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.tealAccent.withOpacity(0.3)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.4),
                      blurRadius: 15,
                      offset: const Offset(0, 5),
                    )
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Resting...',
                              style: TextStyle(color: Colors.tealAccent, fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _currentRestingExercise,
                              style: const TextStyle(color: Colors.white70, fontSize: 11),
                            ),
                          ],
                        ),
                        Row(
                          children: [
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _restSecondsRemaining += 30;
                                  _restSecondsDuration += 30;
                                });
                              },
                              child: const Text('+30s', style: TextStyle(color: Colors.white70)),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton(
                              onPressed: () {
                                setState(() {
                                  _restSecondsRemaining = 0;
                                });
                                _restTimer?.cancel();
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.tealAccent,
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              child: const Text('Skip', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Stack(
                      children: [
                        Container(
                          height: 4,
                          decoration: BoxDecoration(
                            color: Colors.white10,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        AnimatedContainer(
                          duration: const Duration(seconds: 1),
                          height: 4,
                          width: (MediaQuery.of(context).size.width - 72) *
                              (_restSecondsRemaining / _restSecondsDuration),
                          decoration: BoxDecoration(
                            color: Colors.tealAccent,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${_restSecondsRemaining}s',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// Temporary state classes for managing input controllers and completed states
class ActiveExerciseState {
  final PlannedExercise plannedExercise;
  final List<ActiveSetState> setStates;

  ActiveExerciseState({
    required this.plannedExercise,
    required this.setStates,
  });
}

class ActiveSetState {
  final PlannedSetInfo plannedSetInfo;
  final TextEditingController weightController;
  final TextEditingController repsController;
  bool isCompleted;

  ActiveSetState({
    required this.plannedSetInfo,
    required this.weightController,
    required this.repsController,
    this.isCompleted = false,
  });
}
