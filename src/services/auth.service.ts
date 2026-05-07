import { supabase } from '@/lib/supabase'
import type { Role } from '@/types/domain'

export const authService = {
  signUp: async (email: string, password: string, fullName: string, role: Role) => {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    })
  },
  signIn: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password })
  },
  resetPassword: async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  },
}
