import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { attendanceService } from '@/lib/attendanceService'
import { IAttendanceSession } from '@/types/attendance'
import SessionCard from '@/components/SessionCard'
import SessionDialog from '@/components/SessionDialog'
import ConfirmDialog from '@/components/ConfirmDialog'
import SearchInput from '@/components/SearchInput'
import { Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<IAttendanceSession[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const fetchSessions = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const result = await attendanceService.getAllSessions({ page, limit: 12 })
      setSessions(result.data)
      setPagination({ page: result.page, totalPages: result.totalPages })
    } catch {
      // handled by handleApiCall toast
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const handleCreateSession = async (data: {
    date: string
    serviceName: string
    services: Array<{
      order: number
      serviceTime: string
      preServiceTime?: string | null
      closesAt?: string | null
    }>
  }) => {
    try {
      // startedAt anchors the session on the calendar; mirror the first service.
      const startedAt = data.services[0]?.serviceTime ?? new Date(`${data.date}T00:00`).toISOString()
      const session = await attendanceService.startSession({
        serviceName: data.serviceName,
        date: new Date(`${data.date}T00:00`).toISOString(),
        startedAt,
        services: data.services,
      })
      setShowNewDialog(false)
      navigate(`/session/${session.id}`)
    } catch {
      // handled by toast
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await attendanceService.deleteSession(deleteTarget)
      setDeleteTarget(null)
      fetchSessions(pagination.page)
    } catch {
      // handled by toast
    }
  }

  const filteredSessions = sessions.filter((s) =>
    s.serviceName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Attendance Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track church attendance</p>
        </div>
        {/* Desktop button */}
        <button
          onClick={() => setShowNewDialog(true)}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>

      <div className="mb-5 w-full sm:max-w-xs">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search sessions..."
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm">
            {search ? 'No sessions match your search' : 'No attendance sessions yet'}
          </p>
          {!search && (
            <button
              onClick={() => setShowNewDialog(true)}
              className="mt-3 text-sm text-emerald-600 hover:underline font-medium"
            >
              Start your first session
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => navigate(`/session/${session.id}`)}
                onDelete={(e) => {
                  e.stopPropagation()
                  setDeleteTarget(session.id)
                }}
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchSessions(pagination.page - 1)}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchSessions(pagination.page + 1)}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* FAB for mobile */}
      <button
        onClick={() => setShowNewDialog(true)}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-700 active:scale-95 transition-all z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

      <SessionDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onSubmit={handleCreateSession}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Session"
        message="Are you sure you want to delete this session? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
