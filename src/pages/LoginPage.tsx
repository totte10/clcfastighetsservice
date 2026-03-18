const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!username.trim() || !password.trim()) return

  setLoading(true)
  setError("")

  const email = username.trim().toLowerCase()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    setError("Fel användarnamn eller lösenord")
    setLoading(false)
    return
  }

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .single()

  if (!role) {
    setError("Ingen behörighet")
    setLoading(false)
    return
  }

  console.log("Inloggad som:", role.role)

  setLoading(false)
}