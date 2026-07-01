import 'package:flutter/material.dart';
import 'api_service.dart';
import 'models.dart';
import 'screens/dashboard_screen.dart';
import 'screens/routines_screen.dart';
import 'screens/exercises_screen.dart';
import 'screens/history_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Trainy Workout Tracker',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F0F1A),
        colorScheme: const ColorScheme.dark(
          primary: Colors.tealAccent,
          secondary: Colors.tealAccent,
          surface: Color(0xFF1E1E2F),
          onPrimary: Colors.black,
        ),
        useMaterial3: true,
        fontFamily: 'Roboto',
      ),
      home: const WorkoutMainScreen(),
    );
  }
}

class WorkoutMainScreen extends StatefulWidget {
  const WorkoutMainScreen({super.key});

  @override
  State<WorkoutMainScreen> createState() => _WorkoutMainScreenState();
}

class _WorkoutMainScreenState extends State<WorkoutMainScreen> {
  int _currentTab = 0;

  // API Client
  late ApiService _apiService;
  String _baseUrl = ApiService.defaultBaseUrl;

  // Data State
  List<Routine> _routines = [];
  List<Exercise> _exercises = [];
  List<RoutineInstance> _history = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService(baseUrl: _baseUrl);
    _loadAllData();
  }

  Future<void> _loadAllData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final exercises = await _apiService.getExercises();
      final routines = await _apiService.getFullRoutines();
      final history = await _apiService.getFullRoutineInstances();

      setState(() {
        _exercises = exercises;
        _routines = routines;
        _history = history;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      // Show snackbar or visual alert
      debugPrint('Error loading data from backend: $e');
    }
  }

  void _updateBaseUrl(String newUrl) {
    if (newUrl.trim().isEmpty) return;
    setState(() {
      _baseUrl = newUrl.trim();
      _apiService = ApiService(baseUrl: _baseUrl);
    });
    _loadAllData();
  }

  void _showSettingsDialog() {
    final controller = TextEditingController(text: _baseUrl);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E2F),
        title: const Row(
          children: [
            Icon(Icons.settings, color: Colors.tealAccent),
            SizedBox(width: 8),
            Text('Server Connection', style: TextStyle(color: Colors.white)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Specify your Trainy backend URL. For local computer, use localhost. For Android emulator, use 10.0.2.2.',
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'Backend Base URL',
                labelStyle: TextStyle(color: Colors.grey),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.tealAccent)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () {
              _updateBaseUrl(controller.text);
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Connected to: ${controller.text}'),
                  backgroundColor: Colors.teal,
                ),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.tealAccent),
            child: const Text('Connect', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> screens = [
      DashboardScreen(
        routines: _routines,
        history: _history,
        exercises: _exercises,
        isLoading: _isLoading,
        onRefresh: _loadAllData,
        apiService: _apiService,
        onTabChange: (tabIdx) {
          setState(() {
            _currentTab = tabIdx;
          });
        },
      ),
      RoutinesScreen(
        routines: _routines,
        exercises: _exercises,
        isLoading: _isLoading,
        onRefresh: _loadAllData,
        apiService: _apiService,
      ),
      ExercisesScreen(
        exercises: _exercises,
        isLoading: _isLoading,
        onRefresh: _loadAllData,
        apiService: _apiService,
      ),
      HistoryScreen(
        history: _history,
        isLoading: _isLoading,
        onRefresh: _loadAllData,
        apiService: _apiService,
      ),
    ];

    final titles = ['Dashboard', 'Routines', 'Exercises', 'Workout Logs'];

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E1E2F),
        title: Text(
          titles[_currentTab],
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20),
        ),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings, color: Colors.white70),
            onPressed: _showSettingsDialog,
            tooltip: 'Server Settings',
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: _loadAllData,
            tooltip: 'Sync Data',
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0F0F1A), Color(0xFF1E1E2F)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: screens[_currentTab],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentTab,
        onTap: (index) {
          setState(() {
            _currentTab = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: const Color(0xFF1E1E2F),
        selectedItemColor: Colors.tealAccent,
        unselectedItemColor: Colors.white38,
        showUnselectedLabels: true,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        unselectedLabelStyle: const TextStyle(fontSize: 11),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard, color: Colors.tealAccent),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.fitness_center_outlined),
            activeIcon: Icon(Icons.fitness_center, color: Colors.tealAccent),
            label: 'Routines',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.list_alt_outlined),
            activeIcon: Icon(Icons.list_alt, color: Colors.tealAccent),
            label: 'Exercises',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history_outlined),
            activeIcon: Icon(Icons.history, color: Colors.tealAccent),
            label: 'Logs',
          ),
        ],
      ),
    );
  }
}
