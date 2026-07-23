import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { attendanceService, authService } from "@/lib/attendanceService";
import { ApiError } from "@/lib/utils";
import { AttendanceFilterParams } from "@/types/attendance";
import { IUser } from "@/types/user";
import SearchInput from "@/components/SearchInput";
import RegistrationForm, {
   RegistrationFormHandle,
} from "@/components/RegistrationForm";
import AttendanceFilterBar from "@/components/AttendanceFilterBar";
import CloseSessionDialog from "@/components/CloseSessionDialog";
import FinancePanel from "@/components/FinancePanel";
import { UpsertIncomePayload } from "@/types/income";
import { format, set } from "date-fns";
import {
   UserPlus,
   Users,
   Calendar,
   Clock,
   Loader2,
   Download,
   Lock,
   Unlock,
   X,
} from "lucide-react";
import AttendeeList from "@/components/AttendanceList";
import { userService } from "@/lib/userService";
import { useQuery } from "@tanstack/react-query";

function useFetchSession(id: string, filters: AttendanceFilterParams) {
   const {
      data: session,
      isPending,
      refetch,
   } = useQuery({
      queryKey: ["sessions", id],
      queryFn: () => attendanceService.getSessionById(id, filters),
   });

   return { session, isPending, refetch };
}

export default function SessionDetail() {
   const { id: sessionId } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const [showAddPanel, setShowAddPanel] = useState(false);
   const [memberSearch, setMemberSearch] = useState("");
   const [searchResult, setSearchResult] = useState<IUser[]>([]);
   const [searchLoading, setSearchLoading] = useState(false);
   const [showRegistrationForm, setShowRegistrationForm] = useState(false);
   const [registering, setRegistering] = useState(false);
   const [markedAt, setMarkedAt] = useState("");
   const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
   const [filters, setFilters] = useState<AttendanceFilterParams>({});
   const [exporting, setExporting] = useState(false);
   // Service override for the next mark; empty string = auto (backend infers).
   const [serviceOverride, setServiceOverride] = useState<string>("");
   const formRef = useRef<RegistrationFormHandle>(null);
   const {
      session,
      isPending: isSessionPending,
      refetch,
   } = useFetchSession(sessionId ?? "", filters);

   const isFiltered = useMemo(
      () =>
         Boolean(
            (filters.departmentIds && filters.departmentIds.length > 0) ||
            filters.gender ||
            filters.membershipType ||
            filters.churchStatus ||
            filters.lateComers ||
            filters.serviceOrder,
         ),
      [filters],
   );

   const isClosed = Boolean(session?.endedAt);
   const [showCloseDialog, setShowCloseDialog] = useState(false);

   const handleSaveIncome = async (
      payload: UpsertIncomePayload,
      andClose: boolean,
   ) => {
      if (!sessionId) return;
      await attendanceService.upsertSessionIncome(sessionId, payload);
      if (andClose) await attendanceService.closeSession(sessionId);
      await refetch();
   };

   const handleReopen = async () => {
      if (!sessionId) return;
      if (!confirm("Reopen this session?")) return;
      await attendanceService.reopenSession(sessionId);
      await refetch();
   };

   const handleExportPdf = useCallback(async () => {
      if (!sessionId || !session) return;
      setExporting(true);
      try {
         await attendanceService.exportSessionPdf(
            sessionId,
            session.serviceName,
            filters,
         );
      } catch {
         toast.error("Failed to export attendance PDF");
      } finally {
         setExporting(false);
      }
   }, [sessionId, session, filters]);

   const searchMembers = useCallback(async (query: string) => {
      if (query.trim() !== "") {
         setSearchLoading(true);
         try {
            const matches = await userService.searchUsers(query);
            setSearchResult(matches);
            setShowRegistrationForm(matches.length === 0);
         } catch {
            setSearchResult([]);
            setShowRegistrationForm(true);
         } finally {
            setSearchLoading(false);
         }
      } else {
         setSearchResult([]);
         setShowRegistrationForm(false);
      }
   }, []);

   useEffect(() => {
      const timeout = setTimeout(() => searchMembers(memberSearch), 500);
      return () => clearTimeout(timeout);
   }, [memberSearch, searchMembers]);

   const buildDateFromTime = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);

      return set(new Date(), {
         hours,
         minutes,
         seconds: 0,
         milliseconds: 0,
      });
   };

   // Show worker/non-worker on member rows so the marker sees membership at a
   // glance; first-timer/visitor stays as church-status so unfamiliar attendees
   // are obvious. Falls back to "Non-worker" when membershipType is unset.
   const userStatusLabel = (u: IUser) => {
      if (u.churchStatus === "FIRST_TIMER") return "First Timer";
      if (u.churchStatus === "VISITOR") return "Visitor";
      if (u.membershipType === "WORKER") return "Worker";
      return "Non-worker";
   };

   const handleSingleMark = async (userId: string) => {
      if (!sessionId) return;
      try {
         const serviceOrder =
            serviceOverride === "" ? undefined : Number(serviceOverride);
         await attendanceService.markAttendance({
            userId,
            sessionId,
            markedAt: markedAt ? buildDateFromTime(markedAt) : undefined,
            serviceOrder,
         });
         setMemberSearch("");
         setMarkedAt("");
         setSearchResult([]);
         setShowRegistrationForm(false);
         await refetch();
      } catch {
         // handled by toast
      }
   };

   const handleRegisterUser = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      setRegistering(true);
      setFieldErrors({});
      try {
         const formData = new FormData(form);
         const payload: Record<
            string,
            FormDataEntryValue | FormDataEntryValue[]
         > = {};
         formData.forEach((value, key) => {
            payload[key] = value;
         });
         payload.departmentIds = formData.getAll("departmentIds");
         const res = await authService.register(payload);
         if (res?.user?.id) {
            form.reset();
            formRef.current?.reset();
            await handleSingleMark(res.user.id);
         }
      } catch (err) {
         if (err instanceof ApiError && err.fieldErrors) {
            setFieldErrors(err.fieldErrors);
         }
      } finally {
         setRegistering(false);
      }
   };

   if (isSessionPending) {
      return (
         <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
         </div>
      );
   }

   if (!session) {
      return (
         <div className="text-center py-20">
            <p className="text-gray-400">Session not found</p>
            <button
               onClick={() => navigate("/")}
               className="mt-3 text-sm text-emerald-600 hover:underline"
            >
               Go back
            </button>
         </div>
      );
   }

   const date = session.startedAt ? new Date(session.startedAt) : null;
   const attendees = session.attendees || [];
   const markedUserIds = new Set(attendees.map((a) => a.userId));
   const services = session.services ?? [];
   const isMultiService = services.length > 1;

   // Recomputed every render so the indicator naturally flips as the clock
   // passes a service boundary while the page is open.
   const inferredOrder = (() => {
      if (services.length === 0) return 1;
      const reference = markedAt ? buildDateFromTime(markedAt) : new Date();
      const sorted = [...services].sort((a, b) => a.order - b.order);
      for (let i = 0; i < sorted.length - 1; i++) {
         const current = sorted[i];
         const next = sorted[i + 1];
         const boundary = new Date(current.closesAt ?? next.serviceTime);
         if (reference.getTime() < boundary.getTime()) return current.order;
      }
      return sorted[sorted.length - 1].order;
   })();

   return (
      <div className="max-w-4xl mx-auto">
         {/* Session Info */}
         <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <div className="flex-1">
               <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {session.serviceName}
               </h1>
               <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-1">
                  {date && (
                     <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(date, "EEE, dd MMM yyyy")}
                     </span>
                  )}
                  {date && (
                     <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {format(date, "hh:mm a")}
                     </span>
                  )}
                  <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                     <Users className="w-3.5 h-3.5" />
                     {attendees.length} attendees
                  </span>
                  {isClosed && (
                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-800 border border-amber-200">
                        <Lock className="w-3 h-3" /> Closed
                     </span>
                  )}
               </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
               <button
                  onClick={() => setShowCloseDialog(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto"
               >
                  {isClosed ? "Edit Income" : "Close Session"}
               </button>
               {isClosed && (
                  <button
                     onClick={handleReopen}
                     className="flex items-center justify-center gap-2 px-3 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full sm:w-auto"
                  >
                     <Unlock className="w-3.5 h-3.5" />
                     Reopen
                  </button>
               )}
               <button
                  onClick={handleExportPdf}
                  disabled={exporting || attendees.length === 0}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
               >
                  {exporting ? (
                     <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                     <Download className="w-4 h-4" />
                  )}
                  Export PDF
               </button>
               <button
                  onClick={() => setShowAddPanel(!showAddPanel)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors w-full sm:w-auto"
               >
                  <UserPlus className="w-4 h-4" />
                  Mark Attendance
               </button>
            </div>
         </div>

         <AttendanceFilterBar
            filters={filters}
            onChange={setFilters}
            services={services}
         />

         {isMultiService && (
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 mb-3 flex items-center gap-2 text-xs">
               <span className="text-gray-600">Mark next attendee into:</span>
               <select
                  value={serviceOverride}
                  onChange={(e) => setServiceOverride(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white"
               >
                  <option value="">Auto (Service {inferredOrder})</option>
                  {services.map((s) => (
                     <option key={s.order} value={s.order}>
                        Service {s.order}
                     </option>
                  ))}
               </select>
               {serviceOverride !== "" && (
                  <button
                     type="button"
                     onClick={() => setServiceOverride("")}
                     className="underline text-gray-500"
                  >
                     reset
                  </button>
               )}
            </div>
         )}

         <div className="flex flex-col lg:flex-row gap-5">
            {/* Add Attendance Panel */}
            {showAddPanel && (
               <div className="w-full lg:flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col max-h-[60vh] lg:max-h-[calc(100vh-200px)]">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                     <h3 className="text-sm font-medium text-gray-700">
                        Add Member
                     </h3>
                     <button
                        onClick={() => {
                           setShowAddPanel(false);
                           setMemberSearch("");
                           setSearchResult([]);
                           setShowRegistrationForm(false);
                           setFieldErrors({});
                        }}
                        className="p-1 rounded hover:bg-gray-200 text-gray-400"
                     >
                        <X className="w-4 h-4" />
                     </button>
                  </div>

                  <div className="p-3 border-b border-gray-100">
                     <SearchInput
                        value={memberSearch}
                        onChange={setMemberSearch}
                        placeholder="Search members..."
                     />
                  </div>

                  <div className="flex-1 overflow-y-auto">
                     {searchLoading ? (
                        <div className="flex justify-center py-8">
                           <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                     ) : searchResult.length > 0 ? (
                        <ul className="divide-y divide-gray-100">
                           {searchResult.map((user) => {
                              const userId = user.id || user._id || "";
                              const alreadyMarked = markedUserIds.has(userId);
                              return (
                                 <li key={userId}>
                                    <div className="flex items-center gap-2">
                                       <button
                                          type="button"
                                          onClick={() =>
                                             !alreadyMarked &&
                                             handleSingleMark(userId)
                                          }
                                          disabled={alreadyMarked}
                                          className={`w-full px-4 py-3 min-h-11 flex justify-between items-center text-left transition-colors ${
                                             alreadyMarked
                                                ? "opacity-50 cursor-not-allowed bg-gray-50"
                                                : "hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                                          }`}
                                       >
                                          <span className="text-sm font-medium text-gray-900">
                                             {user.firstName} {user.lastName}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                             {alreadyMarked
                                                ? "Already marked"
                                                : userStatusLabel(user)}
                                          </span>
                                       </button>
                                       <input
                                          type="time"
                                          value={markedAt}
                                          placeholder="Mark Time"
                                          onChange={(e) =>
                                             setMarkedAt(e.target.value)
                                          }
                                          className="px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                       />
                                    </div>
                                 </li>
                              );
                           })}
                        </ul>
                     ) : !memberSearch.trim() ? (
                        <div className="text-center py-8">
                           <p className="text-xs text-gray-400">
                              Type to search members
                           </p>
                        </div>
                     ) : showRegistrationForm ? (
                        <RegistrationForm
                           ref={formRef}
                           onSubmit={handleRegisterUser}
                           isSubmitting={registering}
                           fieldErrors={fieldErrors}
                        />
                     ) : null}
                  </div>
               </div>
            )}

            {/* Attendee List */}
            <div className="w-full lg:flex-1 space-y-0">
               <FinancePanel services={services} />
               <AttendeeList
                  attendees={attendees}
                  onShowAdd={() => setShowAddPanel(true)}
                  isFiltered={isFiltered}
                  serviceCount={services.length}
               />
            </div>
         </div>

         <CloseSessionDialog
            open={showCloseDialog}
            onClose={() => setShowCloseDialog(false)}
            services={session.services ?? []}
            isClosed={isClosed}
            onSave={handleSaveIncome}
         />
      </div>
   );
}
