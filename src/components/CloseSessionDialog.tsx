import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { ISessionService } from "@/types/attendance";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  IncomeCategory,
  METHOD_LABEL,
  METHOD_ORDER,
  PaymentMethod,
  UpsertIncomePayload,
} from "@/types/income";

interface Props {
  open: boolean;
  onClose: () => void;
  services: ISessionService[];
  isClosed: boolean;
  onSave: (payload: UpsertIncomePayload, andClose: boolean) => Promise<void>;
}

const cellKey = (svc: number, cat: IncomeCategory, m: PaymentMethod) => `${svc}:${cat}:${m}`;

const fmtMoney = (n: number) =>
  n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CloseSessionDialog({
  open,
  onClose,
  services,
  isClosed,
  onSave,
}: Props) {
  const [cells, setCells] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const seeded: Record<string, string> = {};
    for (const svc of services) {
      for (const inc of svc.incomes ?? []) {
        seeded[cellKey(svc.order, inc.category, inc.method)] = String(inc.amount);
      }
    }
    setCells(seeded);
  }, [open, services]);

  const sortedServices = useMemo(
    () => [...services].sort((a, b) => a.order - b.order),
    [services],
  );

  if (!open) return null;

  const getCell = (svc: number, cat: IncomeCategory, m: PaymentMethod) =>
    cells[cellKey(svc, cat, m)] ?? "";
  const setCell = (svc: number, cat: IncomeCategory, m: PaymentMethod, v: string) =>
    setCells((p) => ({ ...p, [cellKey(svc, cat, m)]: v }));

  const totals = sortedServices.map((s) => {
    let cash = 0;
    let transfer = 0;
    for (const cat of CATEGORY_ORDER) {
      cash += Number(getCell(s.order, cat, "CASH")) || 0;
      transfer += Number(getCell(s.order, cat, "TRANSFER")) || 0;
    }
    return { order: s.order, cash, transfer, total: cash + transfer };
  });
  const grand = totals.reduce((acc, t) => acc + t.total, 0);

  const buildPayload = (): UpsertIncomePayload => ({
    services: sortedServices.map((s) => ({
      serviceOrder: s.order,
      entries: CATEGORY_ORDER.flatMap((cat) =>
        METHOD_ORDER.map((m) => {
          const amount = Number(getCell(s.order, cat, m));
          return { category: cat, method: m, amount: Number.isFinite(amount) ? amount : 0 };
        }),
      ),
    })),
  });

  const submit = async (andClose: boolean) => {
    setSaving(true);
    try {
      await onSave(buildPayload(), andClose);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg sm:mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isClosed ? "Edit Income" : "Close Session"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Enter income figures per service. Empty cells are stored as 0.
        </p>

        <div className="space-y-4">
          {sortedServices.map((svc, idx) => {
            const t = totals[idx];
            return (
              <div key={svc.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold">
                    {sortedServices.length > 1 ? `Service ${svc.order}` : "Income"}
                  </h3>
                  <span className="text-xs text-gray-500">
                    Total {fmtMoney(t.total)}
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_repeat(2,minmax(0,5rem))] gap-2 items-end">
                  <div />
                  {METHOD_ORDER.map((m) => (
                    <label key={m} className="text-[10px] text-gray-500">
                      {METHOD_LABEL[m]}
                    </label>
                  ))}
                  {CATEGORY_ORDER.map((cat) => (
                    <div key={cat} className="contents">
                      <div className="text-xs font-medium text-gray-700 py-1">
                        {CATEGORY_LABEL[cat]}
                      </div>
                      {METHOD_ORDER.map((m) => (
                        <input
                          key={m}
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={getCell(svc.order, cat, m)}
                          onChange={(e) => setCell(svc.order, cat, m, e.target.value)}
                          placeholder="0.00"
                          className="px-2 py-2 border border-gray-300 rounded text-xs"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {sortedServices.length > 1 && (
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-semibold text-sm">Grand total</span>
              <span className="font-bold">{fmtMoney(grand)}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => submit(false)}
            disabled={saving}
            className="flex-1 py-2 border border-emerald-600 text-emerald-700 rounded-lg text-sm hover:bg-emerald-50"
          >
            Save
          </button>
          {!isClosed && (
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={saving}
              className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
            >
              {saving ? "Saving..." : "Save & Close"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
