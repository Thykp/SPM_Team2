import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export type Role = "admin" | "staff" | "user"
export type Profile = { id: string; role: Role; display_name?: string | null }

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (u: User | null) => {
    if (!u) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, display_name")
      .eq("id", u.id)
      .single()
    if (!error) setProfile(data as Profile)
  }

  useEffect(() => {
    // initial
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
      void fetchProfile(data.session?.user ?? null)
    })

    // subscribe to changes
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess)
      setUser(sess?.user ?? null)
      await fetchProfile(sess?.user ?? null)
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    await fetchProfile(user)
  }

  const value = useMemo(
    () => ({ session, user, profile, loading, signOut, refreshProfile }),
    [session, user, profile, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
