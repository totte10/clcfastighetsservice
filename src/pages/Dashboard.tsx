import { useAuth } from "@/hooks/useAuth"

export default function Dashboard(){

  const { user } = useAuth()

  return(

    <div className="p-6">

      <h1 className="text-2xl font-bold">
        Dashboard test
      </h1>

      <p className="mt-4">
        User: {user ? "logged in" : "not logged in"}
      </p>

    </div>

  )

}
