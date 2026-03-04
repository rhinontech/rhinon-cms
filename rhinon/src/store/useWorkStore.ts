import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WorkStatus = 'idle' | 'working' | 'break';

export interface Session {
    id: string;
    type: 'work' | 'break';
    startTime: string; // ISO string for persistence
    endTime?: string;
    duration: number; // in seconds
}

interface WorkState {
    status: WorkStatus;
    startTime: string | null;
    breakStartTime: string | null;
    totalWorkedSeconds: number;
    totalBreakSeconds: number;
    sessions: Session[];
    dailyGoalSeconds: number; // Default 8 hours (28800 seconds)

    // Actions
    startWork: () => void;
    pauseWork: () => void;
    resumeWork: () => void;
    stopWork: () => void;
    resetDay: () => void;
    setDailyGoal: (seconds: number) => void;
}

export const useWorkStore = create<WorkState>()(
    persist(
        (set, get) => ({
            status: 'idle',
            startTime: null,
            breakStartTime: null,
            totalWorkedSeconds: 0,
            totalBreakSeconds: 0,
            sessions: [],
            dailyGoalSeconds: 28800,

            startWork: () => {
                const now = new Date().toISOString();
                set((state) => ({
                    status: 'working',
                    startTime: now,
                    sessions: [
                        ...state.sessions,
                        {
                            id: crypto.randomUUID(),
                            type: 'work',
                            startTime: now,
                            duration: 0,
                        },
                    ],
                }));
            },

            pauseWork: () => {
                const now = new Date().toISOString();
                const state = get();

                // Close current work session
                const updatedSessions = [...state.sessions];
                const lastSessionIndex = updatedSessions.findLastIndex(s => s.type === 'work' && !s.endTime);

                if (lastSessionIndex !== -1) {
                    const lastSession = updatedSessions[lastSessionIndex];
                    const duration = Math.floor((new Date(now).getTime() - new Date(lastSession.startTime).getTime()) / 1000);
                    updatedSessions[lastSessionIndex] = {
                        ...lastSession,
                        endTime: now,
                        duration,
                    };

                    set({
                        status: 'break',
                        breakStartTime: now,
                        totalWorkedSeconds: state.totalWorkedSeconds + duration,
                        sessions: [
                            ...updatedSessions,
                            {
                                id: crypto.randomUUID(),
                                type: 'break',
                                startTime: now,
                                duration: 0,
                            }
                        ]
                    });
                }
            },

            resumeWork: () => {
                const now = new Date().toISOString();
                const state = get();

                // Close current break session
                const updatedSessions = [...state.sessions];
                const lastSessionIndex = updatedSessions.findLastIndex(s => s.type === 'break' && !s.endTime);

                if (lastSessionIndex !== -1) {
                    const lastSession = updatedSessions[lastSessionIndex];
                    const duration = Math.floor((new Date(now).getTime() - new Date(lastSession.startTime).getTime()) / 1000);
                    updatedSessions[lastSessionIndex] = {
                        ...lastSession,
                        endTime: now,
                        duration,
                    };

                    set({
                        status: 'working',
                        breakStartTime: null,
                        startTime: now, // New work session start
                        totalBreakSeconds: state.totalBreakSeconds + duration,
                        sessions: [
                            ...updatedSessions,
                            {
                                id: crypto.randomUUID(),
                                type: 'work',
                                startTime: now,
                                duration: 0,
                            }
                        ]
                    });
                }
            },

            stopWork: () => {
                const now = new Date().toISOString();
                const state = get();
                const updatedSessions = [...state.sessions];

                // Close any open session
                if (state.status === 'working') {
                    const lastSessionIndex = updatedSessions.findLastIndex(s => s.type === 'work' && !s.endTime);
                    if (lastSessionIndex !== -1) {
                        const lastSession = updatedSessions[lastSessionIndex];
                        const duration = Math.floor((new Date(now).getTime() - new Date(lastSession.startTime).getTime()) / 1000);
                        updatedSessions[lastSessionIndex] = { ...lastSession, endTime: now, duration };
                        set({ totalWorkedSeconds: state.totalWorkedSeconds + duration });
                    }
                } else if (state.status === 'break') {
                    const lastSessionIndex = updatedSessions.findLastIndex(s => s.type === 'break' && !s.endTime);
                    if (lastSessionIndex !== -1) {
                        const lastSession = updatedSessions[lastSessionIndex];
                        const duration = Math.floor((new Date(now).getTime() - new Date(lastSession.startTime).getTime()) / 1000);
                        updatedSessions[lastSessionIndex] = { ...lastSession, endTime: now, duration };
                        set({ totalBreakSeconds: state.totalBreakSeconds + duration });
                    }
                }

                set({
                    status: 'idle',
                    startTime: null,
                    breakStartTime: null,
                    sessions: updatedSessions,
                });
            },

            resetDay: () => {
                set({
                    status: 'idle',
                    startTime: null,
                    breakStartTime: null,
                    totalWorkedSeconds: 0,
                    totalBreakSeconds: 0,
                    sessions: [],
                });
            },

            setDailyGoal: (seconds) => set({ dailyGoalSeconds: seconds }),
        }),
        {
            name: 'work-tracker-storage',
        }
    )
);
