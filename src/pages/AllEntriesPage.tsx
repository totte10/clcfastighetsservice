import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Job = {
  id: string;
  title: string;
  date: string;
  status: string;
};

const getJobs = async (): Promise<Job[]> => {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("date", { ascending: true });

  if (error) throw error;
  return data;
};

export default function AllEntriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: getJobs,
  });

  if (isLoading) return <div>Laddar...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Alla uppdrag</h1>

      {data?.length === 0 && <p>Inga jobb ännu</p>}

      {data?.map((job) => (
        <div
          key={job.id}
          style={{
            padding: 12,
            marginBottom: 10,
            border: "1px solid #333",
            borderRadius: 8,
          }}
        >
          <h3>{job.title}</h3>
          <p>{job.date}</p>
          <p>Status: {job.status}</p>
        </div>
      ))}
    </div>
  );
}