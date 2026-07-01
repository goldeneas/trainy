import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models.dart';
import '../api_service.dart';

class HistoryScreen extends StatelessWidget {
  final List<RoutineInstance> history;
  final bool isLoading;
  final VoidCallback onRefresh;
  final ApiService apiService;

  const HistoryScreen({
    super.key,
    required this.history,
    required this.isLoading,
    required this.onRefresh,
    required this.apiService,
  });

  void _confirmDeleteInstance(BuildContext context, RoutineInstance instance) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E2F),
        title: const Text('Delete Workout Log', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Are you sure you want to delete this workout log? This will remove it permanently from your history.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () async {
              if (instance.id != null) {
                try {
                  await apiService.deleteRoutineInstance(instance.id!);
                  onRefresh();
                  if (!context.mounted) return;
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Workout log deleted.'),
                      backgroundColor: Colors.teal,
                    ),
                  );
                } catch (e) {
                  if (!context.mounted) return;
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error deleting workout log: $e'),
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
      body: RefreshIndicator(
        onRefresh: () async => onRefresh(),
        color: Colors.tealAccent,
        backgroundColor: const Color(0xFF1E1E2F),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 10),
              // Subtitle
              Text(
                '${history.length} workouts completed in total',
                style: TextStyle(
                  color: Colors.grey[400],
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 16),

              // History list
              Expanded(
                child: isLoading
                    ? const Center(child: CircularProgressIndicator(color: Colors.tealAccent))
                    : history.isEmpty
                        ? ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: [
                              SizedBox(height: MediaQuery.of(context).size.height * 0.25),
                              Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.history_toggle_off, size: 64, color: Colors.grey[700]),
                                    const SizedBox(height: 16),
                                    const Text(
                                      'No workouts logged',
                                      style: TextStyle(
                                        color: Colors.grey,
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      'Start a workout template in the "Routines" tab and complete sets to record your history.',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(color: Colors.grey[500], fontSize: 13),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.only(bottom: 80),
                            physics: const AlwaysScrollableScrollPhysics(),
                            itemCount: history.length,
                            itemBuilder: (context, idx) {
                              final instance = history[idx];
                              return _buildHistoryCard(context, instance);
                            },
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHistoryCard(BuildContext context, RoutineInstance instance) {
    final dateStr = DateFormat('EEEE, MMMM d, yyyy').format(
      DateTime.fromMillisecondsSinceEpoch(instance.finishTimestamp * 1000),
    );
    final timeStr = DateFormat('h:mm a').format(
      DateTime.fromMillisecondsSinceEpoch(instance.finishTimestamp * 1000),
    );

    // Group actual sets by exercise name so we can render them nested
    final Map<String, List<ActualSetInfo>> setsByExercise = {};
    for (var setInfo in instance.actualSetInfos) {
      final name = setInfo.exerciseName ?? 'Exercise';
      if (!setsByExercise.containsKey(name)) {
        setsByExercise[name] = [];
      }
      setsByExercise[name]!.add(setInfo);
    }

    // Calculate total volume for this single workout instance
    double totalVolume = 0;
    int completedSetsCount = 0;
    for (var set in instance.actualSetInfos) {
      totalVolume += (set.weight * set.actualReps);
      completedSetsCount++;
    }

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
          instance.routineName ?? 'Routine Completed',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              '$dateStr • $timeStr',
              style: TextStyle(
                color: Colors.grey[400],
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.tealAccent.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '$completedSetsCount sets',
                    style: const TextStyle(
                      color: Colors.tealAccent,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.purpleAccent.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '${totalVolume.toStringAsFixed(1)} kg volume',
                    style: const TextStyle(
                      color: Colors.purpleAccent,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16, top: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Divider(color: Colors.white10),
                const SizedBox(height: 8),
                if (setsByExercise.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Text(
                      'No sets logged in this workout.',
                      style: TextStyle(color: Colors.white54, fontSize: 13, fontStyle: FontStyle.italic),
                    ),
                  )
                else
                  ...setsByExercise.entries.map((entry) {
                    final exerciseName = entry.key;
                    final setsList = entry.value;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            exerciseName,
                            style: const TextStyle(
                              color: Colors.tealAccent,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          ...setsList.asMap().entries.map((setEntry) {
                            final idx = setEntry.key;
                            final set = setEntry.value;
                            final targetReps = set.plannedSetInfo?.reps;
                            final targetInfoText = targetReps != null ? ' (target $targetReps reps)' : '';

                            return Padding(
                              padding: const EdgeInsets.only(left: 12, top: 4),
                              child: Row(
                                children: [
                                  Text(
                                    'Set ${idx + 1}: ',
                                    style: const TextStyle(color: Colors.white60, fontSize: 12),
                                  ),
                                  Text(
                                    '${set.weight} kg x ${set.actualReps} reps',
                                    style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
                                  ),
                                  if (targetInfoText.isNotEmpty)
                                    Text(
                                      targetInfoText,
                                      style: TextStyle(color: Colors.grey[500], fontSize: 11, fontStyle: FontStyle.italic),
                                    ),
                                ],
                              ),
                            );
                          }),
                        ],
                      ),
                    );
                  }),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton.icon(
                      onPressed: () => _confirmDeleteInstance(context, instance),
                      icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 18),
                      label: const Text(
                        'Delete Workout Log',
                        style: TextStyle(color: Colors.redAccent, fontSize: 13),
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
