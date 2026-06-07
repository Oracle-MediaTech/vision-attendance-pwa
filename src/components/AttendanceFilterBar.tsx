import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, RotateCcw, Search, X } from "lucide-react";
import { AttendanceFilterParams, ISessionService } from "@/types/attendance";
import { IDepartment } from "@/types/user";
import { departmentService } from "@/lib/departmentService";

interface Props {
  filters: AttendanceFilterParams;
  onChange: (next: AttendanceFilterParams) => void;
  /** When provided and length > 1, a "Service" dropdown is rendered. */
  services?: ISessionService[];
}

const selectCls =
  "px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent";

const hasAnyFilter = (f: AttendanceFilterParams) =>
  Boolean(
    (f.departmentIds && f.departmentIds.length > 0) ||
      f.gender ||
      f.membershipType ||
      f.churchStatus ||
      f.lateComers ||
      f.serviceOrder,
  );

export default function AttendanceFilterBar({ filters, onChange, services = [] }: Props) {
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [deptOpen, setDeptOpen] = useState(false);
  const [deptSearch, setDeptSearch] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    departmentService
      .getAll()
      .then((res) => {
        const items = Array.isArray(res?.data) ? res.data : (res as unknown as IDepartment[]);
        if (Array.isArray(items)) setDepartments(items);
      })
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    if (!deptOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setDeptOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [deptOpen]);

  const filteredDepartments = useMemo(
    () =>
      departments.filter((d) =>
        d.name.toLowerCase().includes(deptSearch.toLowerCase()),
      ),
    [departments, deptSearch],
  );

  const selectedDeptNames = useMemo(() => {
    const ids = new Set(filters.departmentIds ?? []);
    return departments.filter((d) => ids.has(d.id));
  }, [departments, filters.departmentIds]);

  const toggleDept = (id: string) => {
    const current = filters.departmentIds ?? [];
    const next = current.includes(id) ? current.filter((d) => d !== id) : [...current, id];
    onChange({ ...filters, departmentIds: next.length > 0 ? next : undefined });
  };

  const setField = <K extends keyof AttendanceFilterParams>(
    key: K,
    value: AttendanceFilterParams[K],
  ) => onChange({ ...filters, [key]: value });

  const reset = () => onChange({});

  const deptButtonLabel =
    selectedDeptNames.length === 0
      ? "Department"
      : selectedDeptNames.length === 1
        ? selectedDeptNames[0].name
        : `${selectedDeptNames.length} departments`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 sm:px-5 py-3 mb-4 flex flex-wrap items-center gap-2">
      {/* Department multi-select */}
      <div className="relative" ref={popoverRef}>
        <button
          type="button"
          onClick={() => setDeptOpen((o) => !o)}
          className={`${selectCls} flex items-center gap-1.5 ${
            selectedDeptNames.length > 0 ? "border-emerald-500 text-emerald-700" : ""
          }`}
        >
          {deptButtonLabel}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {deptOpen && (
          <div className="absolute z-20 top-full mt-1 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                placeholder="Search departments..."
                className="border border-gray-300 rounded-md pl-8 pr-2 py-1.5 text-xs w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="max-h-[180px] overflow-y-auto">
              {filteredDepartments.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">No departments</p>
              ) : (
                filteredDepartments.map((dept) => {
                  const checked = (filters.departmentIds ?? []).includes(dept.id);
                  return (
                    <label
                      key={dept.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDept(dept.id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-gray-700">{dept.name}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected dept chips */}
      {selectedDeptNames.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {selectedDeptNames.map((d) => (
            <span
              key={d.id}
              className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full border border-emerald-200"
            >
              {d.name}
              <button
                type="button"
                onClick={() => toggleDept(d.id)}
                className="hover:text-red-500"
                aria-label={`Remove ${d.name} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <select
        value={filters.gender ?? ""}
        onChange={(e) =>
          setField("gender", (e.target.value || undefined) as AttendanceFilterParams["gender"])
        }
        className={selectCls}
      >
        <option value="">Gender (all)</option>
        <option value="MALE">Male</option>
        <option value="FEMALE">Female</option>
      </select>

      <select
        value={filters.membershipType ?? ""}
        onChange={(e) =>
          setField(
            "membershipType",
            (e.target.value || undefined) as AttendanceFilterParams["membershipType"],
          )
        }
        className={selectCls}
      >
        <option value="">Membership (all)</option>
        <option value="WORKER">Workers</option>
        <option value="NON_WORKER">Non-workers</option>
      </select>

      <select
        value={filters.churchStatus ?? ""}
        onChange={(e) =>
          setField(
            "churchStatus",
            (e.target.value || undefined) as AttendanceFilterParams["churchStatus"],
          )
        }
        className={selectCls}
      >
        <option value="">Status (all)</option>
        <option value="MEMBER">Member</option>
        <option value="FIRST_TIMER">First Timer</option>
        <option value="VISITOR">Visitor</option>
      </select>

      {services.length > 1 && (
        <select
          value={filters.serviceOrder ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setField("serviceOrder", v === "" ? undefined : Number(v));
          }}
          className={selectCls}
        >
          <option value="">Service (all)</option>
          {[...services]
            .sort((a, b) => a.order - b.order)
            .map((s) => (
              <option key={s.order} value={s.order}>
                Service {s.order}
              </option>
            ))}
        </select>
      )}

      <button
        type="button"
        onClick={() => setField("lateComers", filters.lateComers ? undefined : true)}
        className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
          filters.lateComers
            ? "bg-amber-600 text-white border-amber-600"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
        }`}
      >
        Late comers
      </button>

      {hasAnyFilter(filters) && (
        <button
          type="button"
          onClick={reset}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      )}
    </div>
  );
}
