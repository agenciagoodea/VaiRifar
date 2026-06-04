import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzgpctfijfzhhmbrbdg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emdwY3RmaWpmemhobWJyYmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTcyODgsImV4cCI6MjA4NzQ5MzI4OH0.rDFa9vbK_N8MzCbWxUPY6cMbSo3dx5_LgID-VHZlKHM';

// No-op lock para contornar problemas de deadlock com navigator.locks e filas customizadas
const bypassAuthLock = async <Result>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<Result>
): Promise<Result> => {
  return await fn();
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    lock: bypassAuthLock,
  },
});
