import DispatchCard from "./DispatchCard"

interface Props {
  worker: any
  jobs: any[]
}

export default function DispatchColumn({ worker, jobs }: Props) {

  return (

    <div className="min-w-[260px] bg-card border border-border/50 rounded-xl p-3 space-y-3">

      <div className="font-semibold text-sm border-b border-border/40 pb-1">
        {worker.full_name}
      </div>

      <div className="space-y-2">

        {jobs.length === 0 && (
          <div className="text-xs text-muted-foreground">
            Inga jobb
          </div>
        )}

        {jobs.map(job => (
          <DispatchCard key={job.id} job={job} />
        ))}

      </div>

    </div>

  )

}
