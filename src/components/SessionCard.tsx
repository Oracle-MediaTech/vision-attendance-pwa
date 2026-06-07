import { IAttendanceSession } from '@/types/attendance'
import { format } from 'date-fns'
import { Calendar, Clock, Users } from 'lucide-react'

interface SessionCardProps {
  session: IAttendanceSession
  onClick: () => void
  onDelete?: (e: React.MouseEvent) => void
}

export default function SessionCard({ session, onClick }: SessionCardProps) {
  const date = session.startedAt ? new Date(session.startedAt) : null
  const attendeeCount = session.attendees?.length || 0

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all group active:scale-[0.98]"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base truncate">
            {session.serviceName}
          </h3>
          <div className="mt-3 space-y-1.5">
            {date && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {format(date, 'EEE, dd MMM yyyy')}
              </div>
            )}
            {date && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {format(date, 'hh:mm a')}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* <div
            onClick={onDelete}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </div> */}
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
            <Users className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">{attendeeCount}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
