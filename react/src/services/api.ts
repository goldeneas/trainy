import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dynamically determine the default host.
// On Android emulator, localhost refers to the emulator itself, so we use 10.0.2.2.
// On iOS simulator and web, localhost works fine.
const DEFAULT_HOST = Platform.select({
  android: 'http://10.0.2.2:8080',
  default: 'http://localhost:8080',
});

let apiBaseUrl = DEFAULT_HOST;
let initPromise: Promise<void> | null = null;

// Export an initialization helper that screens/functions can await.
// It will only execute the AsyncStorage lookup once.
export const initializeApi = (): Promise<void> => {
  if (initPromise) return initPromise;
  initPromise = AsyncStorage.getItem('saved_server_url')
    .then((savedUrl) => {
      if (savedUrl) {
        apiBaseUrl = savedUrl;
      }
    })
    .catch((err) => {
      console.warn('Failed to load saved server URL:', err);
    });
  return initPromise;
};

// Start initialization in background immediately
initializeApi().catch(() => {});

export const setApiBaseUrl = (url: string) => {
  apiBaseUrl = url;
  AsyncStorage.setItem('saved_server_url', url).catch((err) => {
    console.warn('Failed to save server URL:', err);
  });
};

export const getApiBaseUrl = () => {
  return apiBaseUrl;
};

// --- DATA TYPES & DTOs ---

export interface Exercise {
  ID: number;
  Name: string;
  Notes: string;
  Instructions: string;
  ImageID: number | null;
  MuscleGroupIDs?: number[] | null;
}

export interface PlannedExercise {
  ID: number;
  RestTime: number | null; // in seconds
  TimeUnitID: number | null;
  ExerciseID: number;
  RoutineID: number;
}

export interface PlannedSetInfo {
  ID: number;
  Ord: number;
  PlannedExerciseID: number;
  Reps: number;
  Notes: string;
}

export interface Routine {
  ID: number;
  Name: string;
  Description: string;
  ImageID: number | null;
}

export interface ActualRoutine {
  ID: number;
  FinishTimestamp: number; // Unix timestamp in seconds
  RoutineID: number;
}

export interface ActualSetInfo {
  ID: number;
  Weight: number;
  ActualRoutineID: number;
  PlannedSetInfoID: number;
  ActualReps: number;
}

export interface MuscleGroupDistribution {
  name: string;
  distribution: number;
}

// Request payloads
export interface CreateExerciseDto {
  name: string;
  notes: string;
  instructions: string;
  image_id?: number | null;
  muscle_group_ids?: number[] | null;
}

export interface PlannedSetInfoCreate {
  ord: number;
  reps: number;
  notes: string;
}

export interface RegisterPlannedExerciseDto {
  rest_time?: number | null;
  time_unit_id?: number | null;
  exercise_id: number;
  routine_id: number;
  planned_set_infos: PlannedSetInfoCreate[];
}

export interface CreateRoutineDto {
  name: string;
  description: string;
  image_id?: number | null;
}

export interface ActualSetInfoCreate {
  weight: number;
  planned_set_info_id: number;
  actual_reps: number;
}

export interface RegisterActualRoutineDto {
  routine_id: number;
  actual_set_infos: ActualSetInfoCreate[];
}

// Custom structure for aggregated frontend display
export interface FullPlannedExercise extends PlannedExercise {
  exercise: Exercise | undefined;
  sets: PlannedSetInfo[];
}

export interface FullRoutine extends Routine {
  plannedExercises: FullPlannedExercise[];
}

export interface FullActualSetInfo extends ActualSetInfo {
  plannedSetInfo: PlannedSetInfo | undefined;
  exerciseName: string;
}

export interface FullActualRoutine extends ActualRoutine {
  routineName: string;
  actualSets: FullActualSetInfo[];
}

// --- API METHODS ---

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${apiBaseUrl}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error) {
        errorMsg = errJson.error;
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(errorMsg);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  
  // Some endpoints return the created ID as text or raw JSON number
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export const api = {
  initializeApi,
  // Exercise Endpoints
  getExercises: () => request<Exercise[]>('/v1/exercise'),
  getExerciseById: (id: number) => request<Exercise>(`/v1/exercise/${id}`),
  createExercise: (data: CreateExerciseDto) => 
    request<number>('/v1/exercise', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteExercise: (id: number) => 
    request<{ message: string }>(`/v1/exercise/${id}`, {
      method: 'DELETE',
    }),

  // Planned Exercise Endpoints
  getPlannedExercises: () => request<PlannedExercise[]>('/v1/exercise/instance'),
  getPlannedExerciseById: (id: number) => request<PlannedExercise>(`/v1/exercise/instance/${id}`),
  getPlannedExerciseSets: (id: number) => request<PlannedSetInfo[]>(`/v1/exercise/instance/${id}/set_info`),
  registerPlannedExercise: (data: RegisterPlannedExerciseDto) => 
    request<number>('/v1/exercise/instance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deletePlannedExercise: (id: number) => 
    request<{ message: string }>(`/v1/exercise/instance/${id}`, {
      method: 'DELETE',
    }),

  // Routine Endpoints
  getRoutines: () => request<Routine[]>('/v1/routine'),
  getRoutineById: (id: number) => request<Routine>(`/v1/routine/${id}`),
  createRoutine: (data: CreateRoutineDto) => 
    request<number>('/v1/routine', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteRoutine: (id: number) => 
    request<{ message: string }>(`/v1/routine/${id}`, {
      method: 'DELETE',
    }),

  // Actual Routine Endpoints
  getActualRoutines: () => request<ActualRoutine[]>('/v1/routine/instance'),
  getActualRoutineById: (id: number) => request<ActualRoutine>(`/v1/routine/instance/${id}`),
  getActualRoutineSets: (id: number) => request<ActualSetInfo[]>(`/v1/routine/instance/${id}/set_info`),
  registerActualRoutine: (data: RegisterActualRoutineDto) => 
    request<number>('/v1/routine/instance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteActualRoutine: (id: number) => 
    request<{ message: string }>(`/v1/routine/instance/${id}`, {
      method: 'DELETE',
    }),

  // Stats Endpoints
  getStatsMonthlyRoutines: () => request<ActualRoutine[]>('/v1/stats/routines/monthly'),
  getStatsWeeklyFrequency: () => request<number>('/v1/stats/frequency/week'),
  getStatsTotalWorkouts: () => request<number>('/v1/stats/workouts'),
  getStatsMuscleDistribution: () => request<MuscleGroupDistribution[]>('/v1/stats/distribution/monthly'),

  // Composite helpers for easier UI integration
  async getFullRoutine(routineId: number): Promise<FullRoutine> {
    const [routine, allPlanned, allExercises] = await Promise.all([
      this.getRoutineById(routineId),
      this.getPlannedExercises(),
      this.getExercises(),
    ]);

    const routinePlanned = allPlanned.filter(pe => pe.RoutineID === routineId);
    
    const plannedExercises: FullPlannedExercise[] = await Promise.all(
      routinePlanned.map(async pe => {
        const exercise = allExercises.find(e => e.ID === pe.ExerciseID);
        const sets = await this.getPlannedExerciseSets(pe.ID);
        return {
          ...pe,
          exercise,
          sets: sets.sort((a, b) => a.Ord - b.Ord),
        };
      })
    );

    return {
      ...routine,
      plannedExercises,
    };
  },

  async getFullRoutines(): Promise<FullRoutine[]> {
    const [routines, allPlanned, allExercises] = await Promise.all([
      this.getRoutines(),
      this.getPlannedExercises(),
      this.getExercises(),
    ]);

    const plannedSetsList = await Promise.all(
      allPlanned.map(pe => 
        this.getPlannedExerciseSets(pe.ID)
          .then(sets => ({ peId: pe.ID, sets }))
          .catch(() => ({ peId: pe.ID, sets: [] as PlannedSetInfo[] }))
      )
    );

    const plannedSetsMap = new Map<number, PlannedSetInfo[]>(
      plannedSetsList.map(item => [item.peId, item.sets])
    );

    const fullRoutines: FullRoutine[] = routines.map(r => {
      const routinePlanned = allPlanned.filter(pe => pe.RoutineID === r.ID);
      const plannedExercises: FullPlannedExercise[] = routinePlanned.map(pe => {
        const exercise = allExercises.find(e => e.ID === pe.ExerciseID);
        const sets = plannedSetsMap.get(pe.ID) || [];
        return {
          ...pe,
          exercise,
          sets: sets.slice().sort((a, b) => a.Ord - b.Ord),
        };
      });
      return {
        ...r,
        plannedExercises,
      };
    });

    return fullRoutines;
  },

  async getFullActualRoutines(): Promise<FullActualRoutine[]> {
    const [actualRoutines, routines, exercises, plannedExercises] = await Promise.all([
      this.getActualRoutines(),
      this.getRoutines(),
      this.getExercises(),
      this.getPlannedExercises(),
    ]);

    // Parallel-fetch sets for all planned exercises once
    const plannedSetsList = await Promise.all(
      plannedExercises.map(pe => 
        this.getPlannedExerciseSets(pe.ID)
          .then(sets => ({ peId: pe.ID, sets }))
          .catch(() => ({ peId: pe.ID, sets: [] as PlannedSetInfo[] }))
      )
    );

    // Build a map of planned set info ID -> exerciseName & PlannedSetInfo object
    const plannedSetMap: { [setId: number]: { exerciseName: string; set: PlannedSetInfo } } = {};
    plannedSetsList.forEach(({ peId, sets }) => {
      const pe = plannedExercises.find(p => p.ID === peId);
      if (!pe) return;
      const ex = exercises.find(e => e.ID === pe.ExerciseID);
      const exerciseName = ex ? ex.Name : 'Exercise';

      sets.forEach(s => {
        plannedSetMap[s.ID] = { exerciseName, set: s };
      });
    });

    // Fetch actual sets for all actual routines in parallel
    const fullInstances = await Promise.all(
      actualRoutines.map(async inst => {
        const routine = routines.find(r => r.ID === inst.RoutineID);
        const routineName = routine ? routine.Name : `Routine #${inst.RoutineID}`;
        const actualSetsRaw = await this.getActualRoutineSets(inst.ID).catch(() => [] as ActualSetInfo[]);

        const actualSets: FullActualSetInfo[] = [];

        // Direct O(1) lookup on normalized set data
        for (const set of actualSetsRaw) {
          const id = set.ID ?? (set as any).id;
          const weight = set.Weight ?? (set as any).weight ?? 0;
          const actualRoutineId = set.ActualRoutineID ?? (set as any).actual_routine_id ?? (set as any).routine_instance_id ?? (set as any).routine_inst_id ?? 0;
          const plannedSetInfoId = (set as any).PlannedSetInfoID ?? (set as any).planned_set_info_id ?? (set as any).set_info_id ?? (set as any).PlannedSetInfoId ?? 0;
          const actualReps = set.ActualReps ?? (set as any).actual_reps ?? 0;

          const match = plannedSetMap[plannedSetInfoId];
          const exerciseName = match ? match.exerciseName : 'Exercise';
          const plannedSet = match ? match.set : undefined;

          actualSets.push({
            ID: id,
            Weight: weight,
            ActualRoutineID: actualRoutineId,
            PlannedSetInfoID: plannedSetInfoId,
            ActualReps: actualReps,
            plannedSetInfo: plannedSet,
            exerciseName,
          });
        }

        return {
          ...inst,
          routineName,
          actualSets,
        };
      })
    );

    // Sort by timestamp descending (newest first)
    return fullInstances.sort((a, b) => b.FinishTimestamp - a.FinishTimestamp);
  }
};
