"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Role } from "@/contexts/AuthContext"
import { Profile } from "@/lib/api";

const ROLE_OPTIONS: Role[] = ['Staff', 'Manager', 'Director', 'Senior Management'];

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("Staff");
  const [teams, setTeams] = useState<Array<{ id: string; name: string; department_id: string }>>([]);
  const [team, setTeam] = useState<string | undefined>(undefined);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [department, setDepartment] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

useEffect(() => {
  const fetchTeams = async () => {
    try {
      const response = await Profile.getAllTeams(); // Fetch teams from the API
      console.log("API Response:", response); // Log the API response for debugging

      if (response && Array.isArray(response.data)) {
        setTeams(response.data); // Extract the `data` property and set teams
      } else {
        console.error("Unexpected API response format:", response);
        setTeams([]); // Fallback to an empty array
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      setTeams([]); // Fallback to an empty array in case of an error
    }
  };
  const fetchDepartments = async () => {
    try {
      const response = await Profile.getAllDepartments(); // Fetch departments from the API
      console.log("Departments API Response:", response); // Log the API response for debugging

      if (response && Array.isArray(response.data)) {
        setDepartments(response.data); // Extract the `data` property and set departments
      } else {
        console.error("Unexpected API response format:", response);
        setDepartments([]); // Fallback to an empty array
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartments([]); // Fallback to an empty array in case of an error
    }
  };

  fetchTeams();
  fetchDepartments();
}, []);

  const handleTeamChange = (teamId: string | undefined) => {
    setTeam(teamId);

    // Automatically set the department based on the selected team's department_id
    if (teamId) {
      const selectedTeam = teams.find((t) => t.id === teamId);
      if (selectedTeam) {
        setDepartment(selectedTeam.department_id); // Set department to the team's department_id
      }
    } else {
      setDepartment(undefined); // Reset department if no team is selected
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOk(false)

    // basic validation
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    const first = firstName.trim()
    const last = lastName.trim()
    const displayName = [first, last].filter(Boolean).join(" ")

    setLoading(true)

    // 1) Sign up: stash role + names in user metadata (read by SQL trigger)
    const payload = {
      email: email,
      password: password,
      options: {
        data: {
          initial_role: role,      // for your trigger to coerce role
          first_name: first,       // for your trigger to build display_name
          last_name: last,         // for your trigger to build display_name
          display_name: displayName, // optional convenience copy
          team,                    // for your trigger to set team_id
          department,              // for your trigger to set department_id
        },
      },
    };

    // Log the payload for debugging
    console.log("Payload being sent to supabase.auth.signUp:", payload);

    setLoading(true);

    // Send the payload to Supabase
    const { data, error } = await supabase.auth.signUp(payload);
    if (error) {
      setLoading(false);
      return setError(error.message);
    }

    setLoading(false);

    // 2) If a session exists immediately (no email confirm), also update profiles now
    //    This keeps the app "demo-friendly" and consistent even if trigger already ran.
    const { data: sess } = await supabase.auth.getSession()
    if (sess.session?.user?.id) {
      await supabase
        .from("profiles")
        .update({ role, display_name: displayName })
        .eq("id", sess.session.user.id)
        .then(({ error }) => {
          if (error) console.warn("Profile update failed:", error.message)
        })
    }

    setLoading(false)

    if (!data.session) {
      setOk(true) // email confirmation flow
    } else {
      navigate("/app", { replace: true })
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>Sign up to get started. (Role picker is for demos.)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                aria-invalid={!!error && password !== confirmPassword}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                aria-invalid={!!error && password !== confirmPassword}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={v => setRole(v as Role)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(r => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                In production, roles are assigned by admins, not end-users.
              </p>
            </div>

            {/* Team Field */}
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={team || "none"} onValueChange={(v) => handleTeamChange(v === "none" ? undefined : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a team (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem> {/* Use "none" as the value for the "None" option */}
                  {Array.isArray(teams) &&
                    teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Field */}
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={department || "none"} onValueChange={(v) => setDepartment(v === "none" ? undefined : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem> {/* Use "none" as the value for the "None" option */}
                  {Array.isArray(departments) &&
                    departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {ok && <p className="text-sm text-green-600">Check your inbox to confirm your email.</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <Link to="/">Back to Home</Link>
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link to="/signin" className="underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
