export default function Placeholder() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f5e9] via-[#f0f8f1] to-[#d9f0e0] dark:from-[#1e293b] dark:via-[#0f172a] dark:to-[#1e293b] text-base-content flex flex-col flex items-center bg-base-200">
      {/* Navbar – transparan dengan blur */}
    <div className="sticky top-0 z-10 navbar bg-base-100/80 dark:bg-base-900/80 backdrop-blur-xl shadow-md border-b border-base-300/20">
      <div className="flex-1">
        <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#81c784] to-[#a5d6a7]">
          Transaksi
        </h3>
      </div>

      <div className="flex-none flex items-center gap-3">
        
      </div>
    </div>
      <div className="text-center justify-center flex-grow flex flex-col items-center justify-center px-4 text-center gap-4">
        <h1 className="text-4xl font-bold mb-4">Halaman Ini Sedang Dibuat</h1>
        <p className="text-xl">Coming soon... 🚀</p>
      </div>
    </div>
  )
}