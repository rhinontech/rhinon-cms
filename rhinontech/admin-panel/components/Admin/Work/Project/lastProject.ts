/** localStorage key for the project workspace opened last, so Work → Projects reopens it. */
export const LAST_PROJECT_KEY = "rhinon.lastProject";

export function rememberProject(id: string) {
  try {
    window.localStorage.setItem(LAST_PROJECT_KEY, id);
  } catch {
    /* private mode / blocked storage: the first project is the fallback */
  }
}
