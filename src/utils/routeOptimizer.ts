export interface RouteJob{
  id:string
  lat:number
  lng:number
}

export function optimizeRoute(jobs:RouteJob[]){

  if(jobs.length <= 2) return jobs

  const visited = new Set<string>()
  const route:RouteJob[] = []

  let current = jobs[0]

  route.push(current)
  visited.add(current.id)

  while(route.length < jobs.length){

    let nearest:RouteJob | null = null
    let shortest = Infinity

    for(const job of jobs){

      if(visited.has(job.id)) continue

      const dist = haversine(current,job)

      if(dist < shortest){

        shortest = dist
        nearest = job

      }

    }

    if(!nearest) break

    visited.add(nearest.id)
    route.push(nearest)
    current = nearest

  }

  return route
}

function haversine(a:RouteJob,b:RouteJob){

  const R = 6371

  const dLat = (b.lat-a.lat) * Math.PI/180
  const dLng = (b.lng-a.lng) * Math.PI/180

  const lat1 = a.lat * Math.PI/180
  const lat2 = b.lat * Math.PI/180

  const x =
    Math.sin(dLat/2)**2 +
    Math.sin(dLng/2)**2 * Math.cos(lat1) * Math.cos(lat2)

  return 2 * R * Math.atan2(Math.sqrt(x),Math.sqrt(1-x))

}
