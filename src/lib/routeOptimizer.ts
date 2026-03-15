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

const dist = distance(current,job)

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

function distance(a:RouteJob,b:RouteJob){

const dx = a.lat - b.lat
const dy = a.lng - b.lng

return Math.sqrt(dx*dx + dy*dy)

}