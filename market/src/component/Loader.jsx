import studySpher from "../assets/studySpher.jpeg";

export function PageLoader(){
    return(
        <>
         <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white">
  
  {/* Logo / Image */}
  <div className="relative mb-6">
    {/* Soft glow */}
    <div className="absolute inset-0 rounded-full bg-indigo-400/20 blur-2xl scale-150" />

    <img
      src={studySpher}
      alt="StudyConnect"
      className="relative w-20 h-20 rounded-2xl object-cover shadow-lg shadow-indigo-100"
    />
  </div>

  {/* Brand */}
  <h1 className="text-xl font-bold text-gray-900 tracking-tight">
    Study<span className="text-indigo-600">Connect</span>
  </h1>

  {/* Spinner */}
  <div className="mt-6 flex flex-col items-center gap-3">
    <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
    
    <p className="text-sm text-gray-500 font-medium">
      Loading...
    </p>
  </div>
</div>
        </>
    )
}