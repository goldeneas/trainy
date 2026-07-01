import { Platform } from 'react-native';

// Dynamically determine the default host.
// On Android emulator, localhost refers to the emulator itself, so we use 10.0.2.2.
// On iOS simulator and web, localhost works fine.
const DEFAULT_HOST = Platform.select({
  android: 'http://10.0.2.2:8080',
  default: 'http://localhost:8080',
});

let apiBaseUrl = DEFAULT_HOST;

export const setApiBaseUrl = (url: string) => {
  apiBaseUrl = url;
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

export interface RoutineInstance {
  ID: number;
  FinishTimestamp: number; // Unix timestamp in seconds
  RoutineID: number;
}

export interface ActualSetInfo {
  ID: number;
  Weight: number;
  RoutineInstanceID: number;
  PlannedSetInfoID: number;
  ActualReps: number;
}

// Request payloads
export interface CreateExerciseDto {
  name: string;
  notes: string;
  instructions: string;
  image_id?: number | null;
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

export interface RegisterRoutineInstanceDto {
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

export interface FullRoutineInstance extends RoutineInstance {
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

  // Routine Instance Endpoints
  getRoutineInstances: () => request<RoutineInstance[]>('/v1/routine/instance'),
  getRoutineInstanceById: (id: number) => request<RoutineInstance>(`/v1/routine/instance/${id}`),
  getRoutineInstanceSets: (id: number) => request<ActualSetInfo[]>(`/v1/routine/instance/${id}/set_info`),
  registerRoutineInstance: (data: RegisterRoutineInstanceDto) => 
    request<number>('/v1/routine/instance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteRoutineInstance: (id: number) => 
    request<{ message: string }>(`/v1/routine/instance/${id}`, {
      method: 'DELETE',
    }),

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

    const fullRoutines: FullRoutine[] = [];
    for (const r of routines) {
      const routinePlanned = allPlanned.filter(pe => pe.RoutineID === r.ID);
      const plannedExercises: FullPlannedExercise[] = await Promise.all(
        routinePlanned.map(async pe => {
          const exercise = allExercises.find(e => e.ID === pe.ExerciseID);
          const sets = await this.getPlannedExerciseSets(pe.ID).catch(() => [] as PlannedSetInfo[]);
          return {
            ...pe,
            exercise,
            sets: sets.sort((a, b) => a.Ord - b.Ord),
          };
        })
      );
      fullRoutines.push({
        ...r,
        plannedExercises,
      });
    }

    return fullRoutines;
  },

  async getFullRoutineInstances(): Promise<FullRoutineInstance[]> {
    const [instances, routines, exercises, plannedExercises] = await Promise.all([
      this.getRoutineInstances(),
      this.getRoutines(),
      this.getExercises(),
      this.getPlannedExercises(),
    ]);

    // Fetch sets for each instance in parallel
    const fullInstances = await Promise.all(
      instances.map(async inst => {
        const routine = routines.find(r => r.ID === inst.RoutineID);
        const routineName = routine ? routine.Name : `Routine #${inst.RoutineID}`;
        const actualSetsRaw = await this.getRoutineInstanceSets(inst.ID).catch(() => [] as ActualSetInfo[]);

        const actualSets: FullActualSetInfo[] = [];

        // For each actual set, retrieve exercise info and planned set info
        for (const set of actualSetsRaw) {
          let plannedSet: PlannedSetInfo | undefined;
          let exerciseName = 'Exercise';

          const routinePlanned = plannedExercises.filter(pe => pe.RoutineID === inst.RoutineID);
          for (const pe of routinePlanned) {
            const sets = await this.getPlannedExerciseSets(pe.ID).catch(() => [] as PlannedSetInfo[]);
            const foundSet = sets.find(s => s.ID === set.PlannedSetInfoID);
            if (foundSet) {
              plannedSet = foundSet;
              const ex = exercises.find(e => e.ID === pe.ExerciseID);
              exerciseName = ex ? ex.Name : 'Exercise';
              break;
            }
          }

          actualSets.push({
            ...set,
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
