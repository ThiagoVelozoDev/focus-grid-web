import { useOutletContext } from 'react-router-dom'
import type { LayoutOutletContext } from '../layouts/AppLayout'

export function DashboardReportPage() {
  const { theme } = useOutletContext<LayoutOutletContext>()
  const isDark = theme === 'dark'

  return (
    <main className="mx-auto w-[96%] py-8 md:w-[92%] xl:w-[90%]">
      <section className={`rounded-3xl border p-6 ${isDark ? 'border-[#2f2f2f] bg-[#212121] text-slate-200' : 'border-slate-200 bg-white text-slate-800'}`}>
        <h2 className="font-heading text-2xl">Dashboard</h2>
        <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Relatorio detalhado em construcao.</p>
      </section>
    </main>
  )
}
