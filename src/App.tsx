import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import {
BrowserRouter,
Routes,
Route,
Navigate
} from "react-router-dom"

import { AuthProvider, useAuth } from "@/hooks/useAuth"
import { AppLayout } from "@/components/AppLayout"

import { Loader2 } from "lucide-react"

/* PAGES */

import Dashboard from "@/pages/Dashboard"
import DispatchCenter from "@/pages/DispatchCenter"

import AreasPage from "@/pages/AreasPage"
import TimePage from "@/pages/TimePage"
import AllTimeReportsPage from "@/pages/AllTimeReportsPage"
import AdminPage from "@/pages/AdminPage"

import TidxSopningarPage from "@/pages/TidxSopningarPage"
import EgnaOmradenPage from "@/pages/EgnaOmradenPage"

import ProjectsPage from "@/pages/ProjectsPage"
import PlanningPage from "@/pages/PlanningPage"

import OptimalPage from "@/pages/OptimalPage"
import TmmPage from "@/pages/TmmPage"

import ChatPage from "@/pages/ChatPage"
import VoicePage from "@/pages/VoicePage"

import PayrollPage from "@/pages/PayrollPage"
import MissingCoordinatesPage from "@/pages/MissingCoordinatesPage"

import RoutePlanningPage from "@/pages/RoutePlanningPage"

import LoginPage from "@/pages/LoginPage"
import NotFound from "@/pages/NotFound"


const queryClient = new QueryClient()


/*
PROTECTED ROUTES
*/

function ProtectedRoutes(){

const { user, loading } = useAuth()

if(loading){

return(
<div className="min-h-screen flex items-center justify-center bg-background">

<Loader2 className="h-8 w-8 animate-spin text-primary"/>

</div>
)

}

if(!user){
return <Navigate to="/login" replace />
}

return(

<AppLayout>

<Routes>

{/* DASHBOARD */}

<Route path="/" element={<Dashboard/>} />

{/* DISPATCH */}

<Route path="/dispatch" element={<DispatchCenter/>} />

{/* TIME */}

<Route path="/time" element={<TimePage/>} />
<Route path="/time/reports" element={<AllTimeReportsPage/>} />

{/* PROJECTS */}

<Route path="/projects" element={<ProjectsPage/>} />
<Route path="/planning" element={<PlanningPage/>} />

{/* AREAS */}

<Route path="/areas" element={<AreasPage/>} />
<Route path="/egna" element={<EgnaOmradenPage/>} />
<Route path="/tidx" element={<TidxSopningarPage/>} />

{/* CUSTOMERS */}

<Route path="/optimal" element={<OptimalPage/>} />
<Route path="/tmm" element={<TmmPage/>} />

{/* COMMUNICATION */}

<Route path="/chat" element={<ChatPage/>} />
<Route path="/voice" element={<VoicePage/>} />

{/* ROUTING */}

<Route path="/route" element={<RoutePlanningPage/>} />

{/* REPORTS */}

<Route path="/payroll" element={<PayrollPage/>} />
<Route path="/missing-coords" element={<MissingCoordinatesPage/>} />

{/* ADMIN */}

<Route path="/admin" element={<AdminPage/>} />

{/* 404 */}

<Route path="*" element={<NotFound/>} />

</Routes>

</AppLayout>

)

}


/*
PUBLIC ROUTES
*/

function AppRoutes(){

const { user, loading } = useAuth()

if(loading){

return(
<div className="min-h-screen flex items-center justify-center bg-background">

<Loader2 className="h-8 w-8 animate-spin text-primary"/>

</div>
)

}

return(

<Routes>

<Route
path="/login"
element={user ? <Navigate to="/" replace /> : <LoginPage/>}
/>

<Route path="/*" element={<ProtectedRoutes/>}/>

</Routes>

)

}


/*
ROOT APP
*/

export default function App(){

return(

<QueryClientProvider client={queryClient}>

<TooltipProvider>

<Toaster/>
<Sonner/>

<BrowserRouter>

<AuthProvider>

<AppRoutes/>

</AuthProvider>

</BrowserRouter>

</TooltipProvider>

</QueryClientProvider>

)

}
