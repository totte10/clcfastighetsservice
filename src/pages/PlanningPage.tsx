xed_001"}
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Navigate } from "react-router-dom"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { format } from "date-fns"



interface Worker {
  id: string
  full_name: string
}

interface Project {
  id: string
  name: string
  address: string
  project_number?: string
  datum_planerat: string
}



export default function PlanningPage() {

  const { user } = useAuth()

  const [items, setItems] = useState<Project[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])

  const [editing, setEditing] = useState<Project | null>(null)
  const [creating, setCreating] = useState(false)

  const [form, setForm] = useState({
    name: "",
    address: "",
    date: "",
    project_number: "",
    workers: [] as string[]
  })

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)



  /* ADMIN CHECK /

  useEffect(() => {

    if (!user) return

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        setIsAdmin(!!data)
      })

  }, [user])



  / LOAD WORKERS /

  useEffect(() => {

    supabase
      .from("profiles")
      .select("id, full_name")
      .then(({ data }) => {
        setWorkers(data ?? [])
      })

  }, [])



  / LOAD PROJECTS /

  async function loadItems() {

    const { data } = await supabase
      .from("projects")
      .select("")
      .order("datum_planerat")

    setItems(data ?? [])

  }

  useEffect(() => {
    loadItems()
  }, [])



  /* SAVE EDIT /

  async function saveEdit() {

    if (!editing) return

    await supabase
      .from("projects")
      .update({
        name: form.name,
        address: form.address,
        project_number: form.project_number,
        datum_planerat: form.date
      })
      .eq("id", editing.id)



    await supabase
      .from("project_assignments")
      .delete()
      .eq("entry_id", editing.id)
      .eq("entry_type", "project")



    const assignments = form.workers.map(uid => ({
      entry_id: editing.id,
      entry_type: "project",
      user_id: uid
    }))

    if (assignments.length) {
      await supabase
        .from("project_assignments")
        .insert(assignments)
    }

    await loadItems()

    setEditing(null)

  }



  / CREATE PROJECT /

  async function createJob() {

    const { data } = await supabase
      .from("projects")
      .insert({
        name: form.name,
        address: form.address,
        project_number: form.project_number,
        datum_planerat: form.date
      })
      .select()
      .single()



    if (data) {

      const assignments = form.workers.map(uid => ({
        entry_id: data.id,
        entry_type: "project",
        user_id: uid
      }))

      if (assignments.length) {
        await supabase
          .from("project_assignments")
          .insert(assignments)
      }

    }

    await loadItems()

    setCreating(false)

  }



  if (isAdmin === null) return null
  if (!isAdmin) return <Navigate to="/" replace />



  return (

    <div className="space-y-6 pb-24">

      <h1 className="text-2xl font-bold">
        Planering
      </h1>



      <Button
        onClick={() => {

          setCreating(true)

          setForm({
            name: "",
            address: "",
            date: format(new Date(), "yyyy-MM-dd"),
            project_number: "",
            workers: []
          })

        }}
      >

        Nytt uppdrag

      </Button>



      <Card>

        <CardContent className="space-y-3 p-4">

          {items.map(item => (

            <div
              key={item.id}
              className="border rounded-lg p-3 flex justify-between items-center"
            >

              <div>

                <p className="font-medium">
                  {item.name}
                </p>

                <p className="text-xs text-muted-foreground">
                  {item.address}
                </p>

              </div>

              <Button
                size="sm"
                onClick={() => {

                  setEditing(item)

                  setForm({
                    name: item.name,
                    address: item.address,
                    date: item.datum_planerat,
                    project_number: item.project_number ?? "",
                    workers: []
                  })

                }}
              >

                Ändra

              </Button>

            </div>

          ))}

        </CardContent>

      </Card>



      {/ EDIT /}

      {editing && (

        <Dialog open onOpenChange={() => setEditing(null)}>

          <DialogContent className="space-y-4">

            <DialogHeader>
              <DialogTitle>Redigera uppdrag</DialogTitle>
            </DialogHeader>

            <Input
              placeholder="Namn"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <Input
              placeholder="Adress"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
            />

            <Input
              placeholder="Projektnummer"
              value={form.project_number}
              onChange={e => setForm({ ...form, project_number: e.target.value })}
            />

            <Input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
            />



            <div className="grid grid-cols-2 gap-2">

              {workers.map(w => (

                <label key={w.id} className="flex items-center gap-2 text-xs">

                  <input
                    type="checkbox"
                    checked={form.workers.includes(w.id)}
                    onChange={(e) => {

                      if (e.target.checked) {

                        setForm({
                          ...form,
                          workers: [...form.workers, w.id]
                        })

                      } else {

                        setForm({
                          ...form,
                          workers: form.workers.filter(id => id !== w.id)
                        })

                      }

                    }}
                  />

                  {w.full_name}

                </label>

              ))}

            </div>



            <Button onClick={saveEdit}>
              Spara
            </Button>

          </DialogContent>

        </Dialog>

      )}



      {/ CREATE */}

      {creating && (

        <Dialog open onOpenChange={() => setCreating(false)}>

          <DialogContent className="space-y-4">

            <DialogHeader>
              <DialogTitle>Nytt uppdrag</DialogTitle>
            </DialogHeader>

            <Input
              placeholder="Namn"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <Input
              placeholder="Adress"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
            />

            <Input
              placeholder="Projektnummer"
              value={form.project_number}
              onChange={e => setForm({ ...form, project_number: e.target.value })}
            />

            <Input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
            />



            <div className="grid grid-cols-2 gap-2">

              {workers.map(w => (

                <label key={w.id} className="flex items-center gap-2 text-xs">

                  <input
                    type="checkbox"
                    checked={form.workers.includes(w.id)}
                    onChange={(e) => {

                      if (e.target.checked) {

                        setForm({
                          ...form,
                          workers: [...form.workers, w.id]
                        })

                      } else {

                        setForm({
                          ...form,
                          workers: form.workers.filter(id => id !== w.id)
                        })

                      }

                    }}
                  />

                  {w.full_name}

                </label>

              ))}

            </div>



            <Button onClick={createJob}>
              Skapa uppdrag
            </Button>

          </DialogContent>

        </Dialog>

      )}

    </div
