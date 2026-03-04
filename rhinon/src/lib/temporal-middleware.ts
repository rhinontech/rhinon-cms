import { StateCreator } from 'zustand';

export interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

export interface HistoryActions {
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
}

export const temporal = <T extends object>(
    config: StateCreator<T>
): StateCreator<T & HistoryActions> => (set, get, api) => {
    const initialState = config(
        (partial, replace) => {
            const nextState = typeof partial === 'function' ? partial(get()) : partial;

            set((state: any) => {
                const newPresent = replace ? nextState : { ...state, ...nextState };

                // Don't track history for undo/redo actions themselves
                if ('_isHistoryAction' in (nextState as any)) {
                    return nextState;
                }

                return {
                    ...newPresent,
                    past: [...state.past.slice(-49), state.present], // Keep last 50 states
                    present: newPresent,
                    future: [], // Clear future when new action is performed
                };
            });
        },
        get,
        api
    );

    return {
        ...initialState,
        past: [],
        present: initialState,
        future: [],

        undo: () => {
            set((state: any) => {
                if (state.past.length === 0) return state;

                const previous = state.past[state.past.length - 1];
                const newPast = state.past.slice(0, -1);

                return {
                    ...previous,
                    past: newPast,
                    present: previous,
                    future: [state.present, ...state.future],
                    _isHistoryAction: true,
                };
            });
        },

        redo: () => {
            set((state: any) => {
                if (state.future.length === 0) return state;

                const next = state.future[0];
                const newFuture = state.future.slice(1);

                return {
                    ...next,
                    past: [...state.past, state.present],
                    present: next,
                    future: newFuture,
                    _isHistoryAction: true,
                };
            });
        },

        canUndo: () => {
            const state = get() as any;
            return state.past.length > 0;
        },

        canRedo: () => {
            const state = get() as any;
            return state.future.length > 0;
        },
    };
};
