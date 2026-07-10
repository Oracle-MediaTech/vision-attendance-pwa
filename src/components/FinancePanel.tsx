import { useMemo } from "react";
import { ISessionService } from "@/types/attendance";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  IncomeCategory,
  METHOD_LABEL,
  METHOD_ORDER,
  PaymentMethod,
} from "@/types/income";

interface Props {
  services: ISessionService[];
}

const fmtMoney = (n: number) =>
  n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Read-only finance display for the PWA's session detail. Mirrors the
 *  admin version's behaviour: skips itself when nothing's recorded. */
export default function FinancePanel({ services }: Props) {
  const sorted = useMemo(
    () => [...services].sort((a, b) => a.order - b.order),
    [services],
  );

  const hasAnyIncome = sorted.some((s) =>
    (s.incomes ?? []).some((i) => Number(i.amount) > 0),
  );
  if (!hasAnyIncome) return null;

  const isMulti = sorted.length > 1;
  const cellOf = (
    svc: ISessionService,
    cat: IncomeCategory,
    m: PaymentMethod,
  ): number => {
    const row = (svc.incomes ?? []).find(
      (i) => i.category === cat && i.method === m,
    );
    return row ? Number(row.amount) : 0;
  };

  const serviceTotal = (svc: ISessionService) =>
    (svc.incomes ?? []).reduce((acc, i) => acc + Number(i.amount), 0);

  const grandTotal = sorted.reduce((acc, s) => acc + serviceTotal(s), 0);

  return (
    <div className="w-full lg:flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
      <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50">
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          Finance Record
        </span>
      </div>
      <div className="p-4 space-y-4">
        {sorted.map((svc) => {
          const total = serviceTotal(svc);
          if (total === 0) return null;
          return (
            <div key={svc.id} className="space-y-2">
              {isMulti && (
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-gray-900">
                    Service {svc.order}
                  </span>
                  <span className="text-xs text-gray-500">
                    Total {fmtMoney(total)}
                  </span>
                </div>
              )}
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] text-gray-500 border-b">
                    <th className="py-1 font-medium">Category</th>
                    {METHOD_ORDER.map((m) => (
                      <th key={m} className="py-1 font-medium text-right">
                        {METHOD_LABEL[m]}
                      </th>
                    ))}
                    <th className="py-1 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORY_ORDER.map((cat) => {
                    const cash = cellOf(svc, cat, "CASH");
                    const transfer = cellOf(svc, cat, "TRANSFER");
                    if (cash === 0 && transfer === 0) return null;
                    return (
                      <tr key={cat} className="border-b last:border-0">
                        <td className="py-1.5 text-gray-700">{CATEGORY_LABEL[cat]}</td>
                        <td className="py-1.5 text-right">{fmtMoney(cash)}</td>
                        <td className="py-1.5 text-right">{fmtMoney(transfer)}</td>
                        <td className="py-1.5 text-right font-medium">
                          {fmtMoney(cash + transfer)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        {isMulti && (
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm font-semibold">Grand total</span>
            <span className="text-base font-bold">{fmtMoney(grandTotal)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
