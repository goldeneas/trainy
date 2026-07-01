import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models.dart';
import '../api_service.dart';

class DashboardScreen extends StatelessWidget {
  final List<Routine> routines;
  final List<RoutineInstance> history;
  final List<Exercise> exercises;
  final bool isLoading;
  final VoidCallback onRefresh;
  final ApiService apiService;
  final Function(int) onTabChange;

  const DashboardScreen({
    super.key,
    required this.routines,
    required this.history,
    required this.exercises,
    required this.isLoading,
    required this.onRefresh,
    required this.apiService,
    required this.onTabChange,
  });

  @override
  Widget build(BuildContext context) {
    final recentHistory = history.take(3).toList();
    final totalWorkouts = history.length;
    final lastWorkoutDate = history.isNotEmpty
        ? DateFormat('MMM d, yyyy').format(
            DateTime.fromMillisecondsSinceEpoch(
              history.first.finishTimestamp * 1000,
            ),
          )
        : 'N/A';

    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      color: Colors.tealAccent,
      backgroundColor: const Color(0xFF1E1E2F),
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Welcome Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome back,',
                    style: TextStyle(
                      color: Colors.grey[400],
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Iron Athlete',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
              CircleAvatar(
                radius: 26,
                backgroundColor: Colors.tealAccent.withOpacity(0.1),
                child: const Icon(
                  Icons.fitness_center,
                  color: Colors.tealAccent,
                  size: 28,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Statistics Card (Vibrant Gradient)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF3A47D5), Color(0xFF00D2FF)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF00D2FF).withOpacity(0.3),
                  blurRadius: 15,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Total Workouts',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '$totalWorkouts',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 36,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          const Icon(
                            Icons.calendar_today,
                            color: Colors.white70,
                            size: 14,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Last: $lastWorkoutDate',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  height: 80,
                  width: 2,
                  color: Colors.white24,
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(left: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Active Routines',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${routines.length}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 36,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 12),
                        InkWell(
                          onTap: () => onTabChange(1), // Go to Routines
                          child: const Row(
                            children: [
                              Text(
                                'View all',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                              SizedBox(width: 4),
                              Icon(
                                Icons.arrow_forward,
                                color: Colors.white,
                                size: 12,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 30),

          // Quick Action Header
          const Text(
            'Quick Actions',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),

          // Quick Action Grid/Row
          Row(
            children: [
              Expanded(
                child: _buildActionCard(
                  context,
                  title: 'Start Routine',
                  subtitle: 'Pick template',
                  icon: Icons.play_arrow_rounded,
                  color: const Color(0xFF1E293B),
                  iconColor: Colors.tealAccent,
                  onTap: () => onTabChange(1), // Go to Routines
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildActionCard(
                  context,
                  title: 'Exercises',
                  subtitle: 'Manage library',
                  icon: Icons.list_alt_rounded,
                  color: const Color(0xFF1E293B),
                  iconColor: Colors.purpleAccent,
                  onTap: () => onTabChange(2), // Go to Exercises
                ),
              ),
            ],
          ),

          // Seed Default Data Button (if no routines exist)
          if (routines.isEmpty && !isLoading) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.amberAccent.withOpacity(0.08),
                border: Border.all(color: Colors.amberAccent.withOpacity(0.2)),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  const Row(
                    children: [
                      Icon(Icons.lightbulb_outline, color: Colors.amberAccent),
                      SizedBox(width: 8),
                      Text(
                        'Getting Started?',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'It looks like you don\'t have any exercises or routines configured yet. Pre-populate the app with standard templates to test logging immediately!',
                    style: TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () async {
                      try {
                        await apiService.seedDefaultData();
                        onRefresh();
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Successfully seeded default exercises & routines!'),
                            backgroundColor: Colors.teal,
                          ),
                        );
                      } catch (e) {
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Error seeding: $e'),
                            backgroundColor: Colors.redAccent,
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.flash_on, color: Colors.black),
                    label: const Text(
                      'Seed Sample Workouts',
                      style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.amberAccent,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 30),

          // Recent Activity Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Recent Workouts',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (history.isNotEmpty)
                TextButton(
                  onPressed: () => onTabChange(3), // Go to History
                  child: const Text(
                    'See All',
                    style: TextStyle(color: Colors.tealAccent),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),

          // Recent Activity List
          if (isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(20.0),
                child: CircularProgressIndicator(color: Colors.tealAccent),
              ),
            )
          else if (recentHistory.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B).withOpacity(0.5),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.history_toggle_off,
                    size: 48,
                    color: Colors.grey[600],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'No workouts logged yet',
                    style: TextStyle(
                      color: Colors.grey[400],
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Perform and log your first routine to see it here.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            )
          else
            ...recentHistory.map((item) {
              final dateStr = DateFormat('EEEE, MMMM d • h:mm a').format(
                DateTime.fromMillisecondsSinceEpoch(
                  item.finishTimestamp * 1000,
                ),
              );

              // Gather unique exercises performed
              final exercisesNames = item.actualSetInfos
                  .map((e) => e.exerciseName ?? 'Exercise')
                  .toSet()
                  .toList();
              final exercisesPreview = exercisesNames.isNotEmpty
                  ? exercisesNames.join(', ')
                  : 'No sets logged';

              return Card(
                color: const Color(0xFF1E293B),
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: InkWell(
                  onTap: () => onTabChange(3), // Switch to history to view detailed breakdown
                  borderRadius: BorderRadius.circular(16),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.tealAccent.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.check_circle_outline,
                            color: Colors.tealAccent,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.routineName ?? 'Routine Completed',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                dateStr,
                                style: TextStyle(
                                  color: Colors.grey[400],
                                  fontSize: 12,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                exercisesPreview,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: Colors.grey[500],
                                  fontSize: 12,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(
                          Icons.chevron_right,
                          color: Colors.white30,
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildActionCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return Material(
      color: color,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  icon,
                  color: iconColor,
                  size: 24,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(
                  color: Colors.grey[400],
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
