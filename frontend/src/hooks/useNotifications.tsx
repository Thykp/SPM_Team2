import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export type Notification = {
  id: string
  notif_text: string
  notif_type: string
  from_user: string
  to_user: string
  created_at?: string
  from_email?: string // <- derived from profiles
  resource_type?: string
  resource_id?: string
  project_id?: string
  priority?: string
  delivery_channels?: string[]
  metadata?: Record<string, unknown>
}

// Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!userId) return

    // 1. Fetch existing notifications with join
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications_with_user")
        .select("*")
        .eq("to_user", userId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("❌ Error fetching notifications:", error.message)
        return
      }

      if (data) {
        const enriched = data.map((n: any) => ({
          ...n,
          from_username: n.profiles?.username ?? "Unknown",
        }))
        setNotifications(enriched)
      }
    }

    fetchNotifications()

    // 2. Connect to WebSocket
    const ws = new WebSocket(`ws://localhost:4201/ws?userId=${userId}`)

    ws.onopen = () => {
      console.log("✅ Connected to notifications WS")
      ws.send(JSON.stringify({ type: "identify", userId }))
    }

    ws.onmessage = async (event) => {
      try {
        const notif = JSON.parse(event.data)

        // fetch username for sender
        let from_username = "Unknown"
        if (notif.from_user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", notif.from_user)
            .single()
          if (profile) from_username = profile.username
        }

        const enriched = { ...notif, from_username }
        console.log("📩 Notification received:", enriched)

        setNotifications((prev) => [enriched, ...prev])
      } catch (err) {
        console.error("❌ Failed to parse WS message", err)
      }
    }

    ws.onclose = () => {
      console.log("❌ Notifications WS closed")
    }

    return () => ws.close()
  }, [userId])

  return notifications

}
