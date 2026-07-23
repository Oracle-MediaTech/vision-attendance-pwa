import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { attendanceService } from "@/lib/attendanceService";
import { IAttendanceSession } from "@/types/attendance";
import { WEEKDAY_LABEL, WEEKDAY_ORDER, Weekday } from "@/types/template";
import SessionCard from "@/components/SessionCard";
import SessionDialog from "@/components/SessionDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import SearchInput from "@/components/SearchInput";
import {
   Plus,
   ChevronDown,
   ChevronLeft,
   ChevronRight,
   Loader2,
} from "lucide-react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

interface SessionGroup {
   key: string;
   title: string;
   subtitle?: string;
   sortKey: number;
   sessions: IAttendanceSession[];
}

// Same grouping algorithm as the admin AttendanceSessionTable so the two
// surfaces stay in sync — ServiceDays first in weekday order, then Special
// Programs, then any orphans.
const groupSessions = (sessions: IAttendanceSession[]): SessionGroup[] => {
   const map = new Map<string, SessionGroup>();
   for (const s of sessions) {
      if (s.serviceDay) {
         const key = `day:${s.serviceDay.id}`;
         if (!map.has(key)) {
            const idx = WEEKDAY_ORDER.indexOf(s.serviceDay.weekday as Weekday);
            map.set(key, {
               key,
               title: s.serviceDay.name,
               subtitle: WEEKDAY_LABEL[s.serviceDay.weekday as Weekday],
               sortKey: idx === -1 ? 50 : idx,
               sessions: [],
            });
         }
         map.get(key)!.sessions.push(s);
      } else if (s.specialProgram) {
         const key = `prog:${s.specialProgram.id}`;
         if (!map.has(key)) {
            map.set(key, {
               key,
               title: s.specialProgram.name,
               subtitle: s.specialProgram.date
                  ? new Date(s.specialProgram.date).toLocaleDateString()
                  : "Special Program",
               sortKey: 100,
               sessions: [],
            });
         }
         map.get(key)!.sessions.push(s);
      } else {
         const key = "orphan";
         if (!map.has(key)) {
            map.set(key, { key, title: "Other", sortKey: 999, sessions: [] });
         }
         map.get(key)!.sessions.push(s);
      }
   }
   return Array.from(map.values()).sort((a, b) => a.sortKey - b.sortKey);
};

function useFetchSessions(page: number = 1, limit: number = 12) {
   const { data, isPending, refetch } = useQuery({
      queryKey: ["sessions", page],
      queryFn: () => getSessionsForPage(page),
      placeholderData: keepPreviousData,
   });
   const sessions = data?.data ?? [];
   const pagination = {
      page: data?.page ?? 1,
      totalPages: data?.totalPages ?? 1,
   };

   function getSessionsForPage(page: number) {
      return attendanceService.getAllSessions({ page, limit });
   }

   return { sessions, pagination, isPending, refetch };
}

export default function Dashboard() {
   const navigate = useNavigate();
   const [search, setSearch] = useState("");
   const [showNewDialog, setShowNewDialog] = useState(false);
   const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
   // Collapsed group keys; default all expanded.
   const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
   const [page, setPage] = useState(1);
   const { sessions, pagination, isPending, refetch } = useFetchSessions(page);

   const nextPage = () => {
      if (page < pagination.totalPages) {
         setPage((p) => p + 1);
      }
   };

   const previousPage = () => {
      if (page > 1) {
         setPage((p) => p - 1);
      }
   };

   const toggleGroup = (key: string) =>
      setCollapsed((prev) => {
         const next = new Set(prev);
         if (next.has(key)) next.delete(key);
         else next.add(key);
         return next;
      });

   const handleCreateSession = async (data: {
      date: string;
      serviceName: string;
      services: Array<{
         order: number;
         serviceTime: string;
         preServiceTime?: string | null;
         closesAt?: string | null;
      }>;
      serviceDayId?: string | null;
      specialProgramId?: string | null;
   }) => {
      try {
         // startedAt anchors the session on the calendar; mirror the first service.
         const startedAt =
            data.services[0]?.serviceTime ??
            new Date(`${data.date}T00:00`).toISOString();
         const session = await attendanceService.startSession({
            serviceName: data.serviceName,
            date: new Date(`${data.date}T00:00`).toISOString(),
            startedAt,
            services: data.services,
            serviceDayId: data.serviceDayId ?? null,
            specialProgramId: data.specialProgramId ?? null,
         });
         setShowNewDialog(false);
         navigate(`/session/${session.id}`);
      } catch {
         // handled by toast
      }
   };

   const handleDelete = async () => {
      if (!deleteTarget) return;
      try {
         await attendanceService.deleteSession(deleteTarget);
         setDeleteTarget(null);
         refetch();
      } catch {
         // handled by toast
      }
   };

   const filteredSessions = sessions.filter((s) =>
      s.serviceName.toLowerCase().includes(search.toLowerCase()),
   );

   const groups = useMemo(
      () => groupSessions(filteredSessions),
      [filteredSessions],
   );

   return (
      <div className="max-w-5xl mx-auto">
         <div className="flex items-center justify-between mb-6">
            <div>
               <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Attendance Sessions
               </h1>
               <p className="text-sm text-gray-500 mt-0.5">
                  Manage and track church attendance
               </p>
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

         {isPending ? (
            <div className="flex items-center justify-center py-20">
               <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
         ) : filteredSessions.length === 0 ? (
            <div className="text-center py-20">
               <p className="text-gray-400 text-sm">
                  {search
                     ? "No sessions match your search"
                     : "No attendance sessions yet"}
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
               <div className="space-y-6">
                  {groups.map((group) => {
                     const isCollapsed = collapsed.has(group.key);
                     return (
                        <section key={group.key} className="space-y-2">
                           <button
                              type="button"
                              onClick={() => toggleGroup(group.key)}
                              className="w-full flex items-baseline gap-2 hover:bg-gray-50 rounded px-1 py-1 -mx-1 text-left"
                              aria-expanded={!isCollapsed}
                           >
                              {isCollapsed ? (
                                 <ChevronRight className="w-4 h-4 self-center text-gray-400" />
                              ) : (
                                 <ChevronDown className="w-4 h-4 self-center text-gray-400" />
                              )}
                              <h2 className="text-base font-semibold text-gray-900">
                                 {group.title}
                              </h2>
                              {group.subtitle && (
                                 <span className="text-xs text-gray-500">
                                    {group.subtitle}
                                 </span>
                              )}
                              <span className="text-xs text-gray-400 ml-auto">
                                 {group.sessions.length}{" "}
                                 {group.sessions.length === 1
                                    ? "session"
                                    : "sessions"}
                              </span>
                           </button>
                           {!isCollapsed && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {group.sessions.map((session) => (
                                    <SessionCard
                                       key={session.id}
                                       session={session}
                                       onClick={() =>
                                          navigate(`/session/${session.id}`)
                                       }
                                       onDelete={(e) => {
                                          e.stopPropagation();
                                          setDeleteTarget(session.id);
                                       }}
                                    />
                                 ))}
                              </div>
                           )}
                        </section>
                     );
                  })}
               </div>

               {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-6">
                     <button
                        disabled={pagination.page <= 1}
                        onClick={previousPage}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                     >
                        <ChevronLeft className="w-4 h-4" />
                     </button>
                     <span className="text-sm text-gray-500">
                        Page {pagination.page} of {pagination.totalPages}
                     </span>
                     <button
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={nextPage}
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
   );
}
