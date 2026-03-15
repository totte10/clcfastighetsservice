<header className="
h-[64px]
flex
items-center
justify-between
px-4 md:px-6
sticky
top-0
z-50
border-b
border-white/5
bg-gradient-to-b
from-[#0b1220]/90
to-[#0b1220]/40
backdrop-blur-2xl
shadow-[0_10px_40px_rgba(0,0,0,0.6)]
">

{/* Sidebar button */}

<div className="md:hidden">

<SidebarTrigger className="
text-white/60
hover:text-white
transition
"/>

</div>


{/* Logo center */}

<div className="flex-1 flex justify-center md:justify-start">

<div className="
relative
flex
items-center
justify-center
">

<img
src="/apple-touch-icon.png"
className="
h-10
w-10
object-contain
rounded-xl
drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]
"
/>

<div className="
absolute
inset-0
rounded-xl
bg-blue-500/20
blur-xl
opacity-40
"/>

</div>

</div>


{/* Notifications */}

<div className="relative">

<NotificationBell />

<span className="
absolute
- top-1
- right-1
w-2.5
h-2.5
bg-emerald-400
rounded-full
animate-pulse
"/>

</div>

</header>
