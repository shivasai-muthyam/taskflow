import { supabase } from '@/lib/supabase'

export const profileService = {
  list: async () => supabase.from('profiles').select('*').order('full_name', { ascending: true }),
  projectAssignments: async () =>
    supabase
      .from('project_members')
      .select('user_id, project:projects!project_members_project_id_fkey(id,name)')
      .order('created_at', { ascending: false }),
}
