import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzgpctfijfzhhmbrbdg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emdwY3RmaWpmemhobWJyYmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTcyODgsImV4cCI6MjA4NzQ5MzI4OH0.rDFa9vbK_N8MzCbWxUPY6cMbSo3dx5_LgID-VHZlKHM';

const authLocks = new Map<string, Promise<void>>();

const acquireAuthLock = async <Result>(
  name: string,
  _acquireTimeout: number,
  fn: () => Promise<Result>
): Promise<Result> => {
  const previous = authLocks.get(name) || Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });

  const queued = previous.then(() => current);
  authLocks.set(name, queued);
  await previous;

  try {
    return await fn();
  } finally {
    release();
    if (authLocks.get(name) === queued) {
      authLocks.delete(name);
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    lock: acquireAuthLock,
  },
});
