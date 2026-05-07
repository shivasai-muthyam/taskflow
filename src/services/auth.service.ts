import { supabase } from '@/lib/supabase'

export const authService = {
  signUp: async (email: string, password: string, fullName: string) => {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
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
