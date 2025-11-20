import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from '@shared/api/client'

/* === helpers for demo rows === */
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const names = [
  "Johnson",
  "Chandru",
  "Jayalakshmi",
  "Clement Fabian",
  "Arun",
  "Sangitha",
  "Abinaya",
  "Vinetha",
  "Mylesh",
  "Santhosh April",
  "Dhanush",
  "Shankar",
  "Lakshmi",
  "Kalai Selvi",
  "Azhar",
  "Karthik",
  "Nila",
  "Harini",
  "Aravind",
  "Meena",
  "Vijay",
  "Kaviya",
  "Sowmiya",
  "Bhuvan",
  "Nandha",
  "Priya",
];
const stages = [
  "trainingprogress",
  "liveinterviews",
  "mockinterviews",
  "handsonproject",
  "placement",
];
const paidStatuses = ["paid", "unpaid", "partially paid"];

function moneyIN(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function generateDummyPayments(n = 150) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    const id = rand(50, 9999);
    const name = names[rand(0, names.length - 1)];
    const actual = rand(12000, 200000);
    const discounted = Math.max(10000, actual - rand(1000, 25000));
    const paidStatus = paidStatuses[rand(0, paidStatuses.length - 1)];
    const paid =
      paidStatus === "paid"
        ? discounted
        : paidStatus === "partially paid"
        ? rand(Math.round(discounted * 0.1), Math.round(discounted * 0.8))
        : 0;
    rows.push({
      lead_id: id,
      name,
      formatted_actual_fee: moneyIN(actual),
      formatted_discounted_fee: moneyIN(discounted),
      formatted_fee_paid: moneyIN(paid),
      status: stages[rand(0, stages.length - 1)],
      paid_status: paidStatus,
      created_at: new Date(Date.now() - rand(0, 90) * 86400000).toISOString(),
    });
  }
  return rows;
}

const COLORS = { paid: "#28a745", unpaid: "#dc3545", partial: "#ffc107" };
const STATUS_ORDER = { paid: 0, "partially paid": 1, unpaid: 2 };
const norm = (s) => (s || "").toLowerCase().trim();

/* === nicer axis step for the chart === */
function niceStep(max) {
  if (max <= 10) return 2;
  if (max <= 20) return 5;
  if (max <= 60) return 10;
  if (max <= 120) return 20;
  if (max <= 200) return 25;
  return 50;
}

/* === tiny bar card (no library) === */
function BarCard({ paid, unpaid, partial }) {
  const values = [paid, unpaid, partial];
  const labels = ["Paid", "Unpaid", "Partially Paid"];
  const fills = [COLORS.paid, COLORS.unpaid, COLORS.partial];

  const max = Math.max(...values, 1);
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let y = step; y <= top; y += step) ticks.push(y);

  return (
    <div className="w-[360px] bg-white border rounded-lg shadow px-4 py-4">
      <div className="relative h-[520px]">
        <div className="absolute left-0 top-0 bottom-12 w-10">
          <div className="relative h-full">
            {ticks.map((t) => {
              const pct = 100 - (t / top) * 100;
              return (
                <div
                  key={t}
                  className="absolute left-0 -translate-y-1/2 text-[11px] text-gray-500"
                  style={{ top: `${pct}%` }}
                >
                  {t}
                </div>
              );
            })}
          </div>
        </div>
        <div className="absolute left-10 right-2 top-0 bottom-12">
          {ticks.map((t) => {
            const pct = 100 - (t / top) * 100;
            return (
              <div
                key={t}
                className="absolute left-0 right-0 border-t border-gray-200"
                style={{ top: `${pct}%` }}
              />
            );
          })}
          <div className="absolute inset-0 flex items-end justify-around">
            {values.map((v, i) => {
              const hPct = (v / top) * 100;
              return (
                <div key={i} className="relative flex flex-col items-center">
                  <div className="absolute -top-6 text-[12px] font-semibold">
                    {v}
                  </div>
                  <div
                    className="w-24 rounded-t-md transition-all"
                    style={{ height: `${hPct}%`, background: fills[i] }}
                    aria-label={`${labels[i]}: ${v}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="absolute left-10 right-2 bottom-0 h-12 flex items-end justify-around">
          {labels.map((l) => (
            <div
              key={l}
              className="text-[11px] text-gray-500 text-center w-24 pb-1"
            >
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PaymentInsightsMain() {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const authHeader = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("all");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({ paid: 0, unpaid: 0, partial: 0 });

  /* 👉 set to true to always show dummy rows */
  const USE_DUMMY = true;

  async function loadData(f = "", t = "", s = "all") {
    setLoading(true);
    try {
      let src = [];

      if (USE_DUMMY) {
        src = generateDummyPayments(150);
      } else {
        const qs = new URLSearchParams();
        if (f) qs.append("fromDate", f);
        if (t) qs.append("toDate", t);
        const res = await fetch(
          `${API_BASE_URL}/payments?${qs.toString()}`, // Fixed: removed duplicate /api
          {
            headers: authHeader,
          }
        );
        const data = await res.json();
        src = Array.isArray(data?.payments) ? data.payments : [];
      }

      // date filter (if you're not using server filtering)
      const byDate = src.filter((p) => {
        const created = new Date(p.created_at);
        const from = f ? new Date(f) : null;
        const to = t ? new Date(`${t}T23:59:59`) : null;
        return (!from || created >= from) && (!to || created <= to);
      });

      // status filter for table
      const byStatus =
        s === "all"
          ? byDate
          : byDate.filter((p) => norm(p.paid_status) === norm(s));

      // sorting like original
      byStatus.sort((a, b) => {
        const as = STATUS_ORDER[norm(a.paid_status)] ?? 99;
        const bs = STATUS_ORDER[norm(b.paid_status)] ?? 99;
        return as - bs;
      });

      setRows(byStatus);

      // counts for chart from date-filtered set
      let paid = 0,
        unpaid = 0,
        partial = 0;
      byDate.forEach((p) => {
        const ps = norm(p.paid_status);
        if (ps === "paid") paid++;
        else if (ps === "partially paid") partial++;
        else if (ps === "unpaid" || ps === "not paid") unpaid++;
      });
      setCounts({ paid, unpaid, partial });
    } catch (e) {
      console.error(e);
      setRows(generateDummyPayments(150)); // fallback to demo
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData("", "", "all");
  }, []);

  const apply = () => loadData(fromDate, toDate, status);
  const reset = () => {
    setFromDate("");
    setToDate("");
    setStatus("all");
    loadData("", "", "all");
  };

  return (
    <div className="p-4">
      <div className="w-full grid grid-cols-[360px_1fr_320px] gap-6">
        {/* CHART */}
        <BarCard
          paid={counts.paid}
          unpaid={counts.unpaid}
          partial={counts.partial}
        />

        {/* TABLE CARD — only Y scroll, full grid lines */}
        <div className="bg-white border rounded-lg shadow overflow-hidden">
          <div className="px-5 py-3 border-b">
            <h3 className="text-lg font-semibold text-center">
              Payment Insights
            </h3>
          </div>

          <div className="max-h-[74vh] overflow-y-auto overflow-x-hidden">
            <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
              <colgroup>
                <col style={{ width: "10%" }} /> {/* ID */}
                <col style={{ width: "22%" }} /> {/* Name */}
                <col style={{ width: "12%" }} /> {/* Actual */}
                <col style={{ width: "14%" }} /> {/* Discounted */}
                <col style={{ width: "10%" }} /> {/* Paid */}
                <col style={{ width: "18%" }} /> {/* Status (wider) */}
                <col style={{ width: "16%" }} /> {/* Paid Status (wider) */}
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-100 text-gray-700">
                  {[
                    "ID",
                    "Name",
                    "Actual",
                    "Discounted",
                    "Paid",
                    "Status",
                    "Paid Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-semibold
                                 border-b border-r border-gray-200 first:border-l last:border-r-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No records
                    </td>
                  </tr>
                ) : (
                  // FIXED: Properly formatted table rows
                  rows.map((p, idx) => (
                    <tr key={`${p.lead_id}-${idx}`} className="bg-white hover:bg-gray-50">
                      <td className="px-4 py-3 border-b border-r border-gray-200 first:border-l">
                        {p.lead_id}
                      </td>
                      <td className="px-4 py-3 border-b border-r border-gray-200">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 border-b border-r border-gray-200">
                        {p.formatted_actual_fee}
                      </td>
                      <td className="px-4 py-3 border-b border-r border-gray-200">
                        {p.formatted_discounted_fee}
                      </td>
                      <td className="px-4 py-3 border-b border-r border-gray-200">
                        {p.formatted_fee_paid}
                      </td>
                      <td className="px-4 py-3 border-b border-r border-gray-200">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
                          {p.status.replace(/([a-z])([A-Z])/g, '$1 $2')}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 last:border-r-0">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium capitalize ${
                          p.paid_status?.toLowerCase() === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : p.paid_status?.toLowerCase() === 'partially paid'
                            ? 'bg-yellow-100 text-yellow-800'  
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {p.paid_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white border rounded-lg shadow p-4 h-fit">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Filters</h4>
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">
              From Date:
            </label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">To Date:</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">Status:</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially paid">Partially Paid</option>
            </select>
          </div>
          <div className="space-y-2">
            <button
              onClick={apply}
              className="w-full bg-[#ff3b2e] hover:bg-[#e23428] text-white text-sm font-semibold py-2 rounded transition-colors"
            >
              Apply
            </button>
            <button
              onClick={reset}
              className="w-full bg-[#20c997] hover:bg-[#19b487] text-white text-sm font-semibold py-2 rounded transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}