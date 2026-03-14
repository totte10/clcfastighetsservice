interface Props {
  job: any
}

export default function DispatchCard({ job }: Props) {

  return (

    <div className="bg-muted/40 hover:bg-muted/60 transition p-2 rounded-lg border border-border/40 cursor-pointer">

      <div className="text-xs font-medium">
        {job.name || job.title}
      </div>

      {job.address && (
        <div className="text-[10px] text-muted-foreground truncate">
          {job.address}
        </div>
      )}

      {job.project_number && (
        <div className="text-[10px] text-muted-foreground">
          #{job.project_number}
        </div>
      )}

    </div>

  )

}
