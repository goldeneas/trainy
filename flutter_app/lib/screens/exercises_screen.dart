import 'package:flutter/material.dart';
import '../models.dart';
import '../api_service.dart';

class ExercisesScreen extends StatefulWidget {
  final List<Exercise> exercises;
  final bool isLoading;
  final VoidCallback onRefresh;
  final ApiService apiService;

  const ExercisesScreen({
    super.key,
    required this.exercises,
    required this.isLoading,
    required this.onRefresh,
    required this.apiService,
  });

  @override
  State<ExercisesScreen> createState() => _ExercisesScreenState();
}

class _ExercisesScreenState extends State<ExercisesScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showAddExerciseBottomSheet(BuildContext context) {
    final formKey = GlobalKey<FormState>();
    String name = '';
    String notes = '';
    String instructions = '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E1E2F),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            top: 24,
            left: 24,
            right: 24,
          ),
          child: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Create Exercise',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white70),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Name field
                  TextFormField(
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      labelText: 'Exercise Name *',
                      labelStyle: const TextStyle(color: Colors.grey),
                      filled: true,
                      fillColor: const Color(0xFF2A2A3F),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      prefixIcon: const Icon(Icons.fitness_center, color: Colors.tealAccent),
                    ),
                    validator: (val) =>
                        val == null || val.trim().isEmpty ? 'Please enter a name' : null,
                    onSaved: (val) => name = val!.trim(),
                  ),
                  const SizedBox(height: 16),

                  // Notes field
                  TextFormField(
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      labelText: 'Short Note / Category',
                      labelStyle: const TextStyle(color: Colors.grey),
                      filled: true,
                      fillColor: const Color(0xFF2A2A3F),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      prefixIcon: const Icon(Icons.label_outline, color: Colors.grey),
                      hintText: 'e.g. Chest, Quads, Biceps',
                      hintStyle: TextStyle(color: Colors.grey[600]),
                    ),
                    onSaved: (val) => notes = val?.trim() ?? '',
                  ),
                  const SizedBox(height: 16),

                  // Instructions field
                  TextFormField(
                    style: const TextStyle(color: Colors.white),
                    maxLines: 4,
                    decoration: InputDecoration(
                      labelText: 'Execution Instructions',
                      labelStyle: const TextStyle(color: Colors.grey),
                      filled: true,
                      fillColor: const Color(0xFF2A2A3F),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      hintText: 'Describe how to perform the movement step-by-step...',
                      hintStyle: TextStyle(color: Colors.grey[600]),
                    ),
                    onSaved: (val) => instructions = val?.trim() ?? '',
                  ),
                  const SizedBox(height: 24),

                  // Save Button
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: () async {
                        if (formKey.currentState!.validate()) {
                          formKey.currentState!.save();
                          try {
                            final exercise = Exercise(
                              name: name,
                              notes: notes,
                              instructions: instructions,
                            );
                            await widget.apiService.createExercise(exercise);
                            widget.onRefresh();
                            if (!context.mounted) return;
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Exercise "$name" created!'),
                                backgroundColor: Colors.teal,
                              ),
                            );
                          } catch (e) {
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Failed to save exercise: $e'),
                                backgroundColor: Colors.redAccent,
                              ),
                            );
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.tealAccent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Create Exercise',
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _confirmDeleteExercise(BuildContext context, Exercise exercise) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E2F),
        title: const Text('Delete Exercise', style: TextStyle(color: Colors.white)),
        content: Text(
          'Are you sure you want to delete "${exercise.name}"? This will also remove it from any routines using it.',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () async {
              if (exercise.id != null) {
                try {
                  await widget.apiService.deleteExercise(exercise.id!);
                  widget.onRefresh();
                  if (!context.mounted) return;
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Exercise "${exercise.name}" deleted.'),
                      backgroundColor: Colors.teal,
                    ),
                  );
                } catch (e) {
                  if (!context.mounted) return;
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error deleting exercise: $e'),
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
    final filteredExercises = widget.exercises.where((ex) {
      final query = _searchQuery.toLowerCase();
      return ex.name.toLowerCase().contains(query) ||
          ex.notes.toLowerCase().contains(query) ||
          ex.instructions.toLowerCase().contains(query);
    }).toList();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 10),
            // Search Input
            TextField(
              style: const TextStyle(color: Colors.white),
              onChanged: (val) {
                setState(() {
                  _searchQuery = val;
                });
              },
              decoration: InputDecoration(
                hintText: 'Search exercise library...',
                hintStyle: const TextStyle(color: Colors.grey),
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                filled: true,
                fillColor: const Color(0xFF1E293B),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
            const SizedBox(height: 16),

            // Exercise count
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${filteredExercises.length} Exercises found',
                  style: TextStyle(
                    color: Colors.grey[400],
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                TextButton.icon(
                  onPressed: () => _showAddExerciseBottomSheet(context),
                  icon: const Icon(Icons.add, size: 18, color: Colors.tealAccent),
                  label: const Text('New Exercise', style: TextStyle(color: Colors.tealAccent)),
                ),
              ],
            ),

            // Exercise List
            Expanded(
              child: widget.isLoading
                  ? const Center(child: CircularProgressIndicator(color: Colors.tealAccent))
                  : filteredExercises.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.fitness_center_outlined, size: 64, color: Colors.grey[700]),
                              const SizedBox(height: 16),
                              Text(
                                _searchQuery.isEmpty ? 'Your library is empty' : 'No exercises match search',
                                style: TextStyle(
                                  color: Colors.grey[500],
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              if (_searchQuery.isEmpty)
                                ElevatedButton.icon(
                                  onPressed: () => _showAddExerciseBottomSheet(context),
                                  icon: const Icon(Icons.add, color: Colors.black),
                                  label: const Text('Add your first exercise', style: TextStyle(color: Colors.black)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.tealAccent,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.only(bottom: 80),
                          itemCount: filteredExercises.length,
                          itemBuilder: (context, idx) {
                            final ex = filteredExercises[idx];
                            return _buildExerciseTile(context, ex);
                          },
                        ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddExerciseBottomSheet(context),
        backgroundColor: Colors.tealAccent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: const Icon(Icons.add, color: Colors.black),
      ),
    );
  }

  Widget _buildExerciseTile(BuildContext context, Exercise exercise) {
    return Card(
      color: const Color(0xFF1E293B),
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: ExpansionTile(
        collapsedIconColor: Colors.white70,
        iconColor: Colors.tealAccent,
        title: Text(
          exercise.name,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: exercise.notes.isNotEmpty
            ? Container(
                margin: const EdgeInsets.only(top: 4),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.tealAccent.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  exercise.notes,
                  style: const TextStyle(
                    color: Colors.tealAccent,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              )
            : null,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16, top: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Divider(color: Colors.white10),
                const SizedBox(height: 8),
                const Text(
                  'INSTRUCTIONS:',
                  style: TextStyle(
                    color: Colors.grey,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  exercise.instructions.isNotEmpty ? exercise.instructions : 'No instructions provided.',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton.icon(
                      onPressed: () => _confirmDeleteExercise(context, exercise),
                      icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 18),
                      label: const Text(
                        'Delete Exercise',
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
