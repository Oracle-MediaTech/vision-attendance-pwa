import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
