import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export type Role = "admin" | "staff" | "user"
export type Profile = { id: string; role: Role; display_name?: string | null }

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: Profile | null
  authLoading: boolean
  profileLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const fetchProfile = async (u: User | null) => {
    if (!u) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, display_name")
      .eq("id", u.id)
      .maybeSingle()
    if (error) console.error("[Auth] profile fetch error", error)
    setProfile((data as Profile) ?? null)
    setProfileLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data, error }) => {
      if (cancelled) return
      if (error) console.error("[Auth] getSession error", error)
      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)
      setAuthLoading(false)
      void fetchProfile(data.session?.user ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (cancelled) return
      setSession(sess)
      setUser(sess?.user ?? null)
      if (!sess) {
        setProfile(null)
        setProfileLoading(false)
      } else {
        void fetchProfile(sess.user)
      }
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
    setProfileLoading(false)
  }

  const refreshProfile = async () => {
    await fetchProfile(user)
  }

  const value = useMemo(
    () => ({ session, user, profile, authLoading, profileLoading, signOut, refreshProfile }),
    [session, user, profile, authLoading, profileLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
