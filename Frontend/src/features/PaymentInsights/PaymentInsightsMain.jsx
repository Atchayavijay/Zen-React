import React, { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import apiClient from '@shared/api/client';
import { endpoints } from '@shared/api/endpoints';
import { FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const COLORS = { 
  paid: "#28a745", 
  unpaid: "#dc3545", 
  partial: "#ffc107" 
};

const STATUS_ORDER = { 
  paid: 0, 
  "partially paid": 1, 
  unpaid: 2,
  "not paid": 2 
};

const norm = (s) => (s || "").toLowerCase().trim();

function moneyIN(n) {
  if (!n && n !== 0) return "₹0";
  return "₹" + Number(n).toLocaleString("en-IN");
}

export default function PaymentInsightsMain() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({ paid: 0, unpaid: 0, partial: 0 });
  const [summaryData, setSummaryData] = useState({
    paid: { count: 0, total: 0 },
    unpaid: { count: 0, total: 0 },
    partial: { count: 0, paid: 0, remaining: 0 }
  });

  async function loadData(f = "", t = "", s = "all") {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (f) qs.append("fromDate", f);
      if (t) qs.append("toDate", t);
      
      const res = await apiClient.get(`${endpoints.leads.root}?${qs.toString()}`);
      let src = Array.isArray(res.data) ? res.data : [];

      // 1. Auto-correct status based on actual amounts
      src = src.map(p => {
        const feePaid = parseFloat(p.fee_paid) || 0;
        const discountedFee = parseFloat(p.discounted_fee) || 0;
        
        let correctedStatus = p.paid_status;

        // Logic: Trust the money, not the label
        if (discountedFee > 0) {
          if (feePaid >= discountedFee) {
            correctedStatus = 'paid';
          } else if (feePaid > 0) {
            correctedStatus = 'partially paid';
          } else {
            correctedStatus = 'unpaid';
          }
        } else if (discountedFee === 0 && p.paid_status) {
             // If fee is 0, keep existing status or default to paid? 
             // Usually 0 fee means free/paid, but let's leave it unless it's explicitly 'unpaid' with 0 balance
             if(norm(p.paid_status) === 'unpaid' || norm(p.paid_status) === 'not paid') {
                 correctedStatus = 'paid'; 
             }
        }

        return { ...p, paid_status: correctedStatus };
      });

      // Filter by date range
      const byDate = src.filter((p) => {
        if (!p.created_at) return true;
        const created = new Date(p.created_at);
        const from = f ? new Date(f) : null;
        const to = t ? new Date(`${t}T23:59:59`) : null;
        return (!from || created >= from) && (!to || created <= to);
      });

      // Filter by status for table
      const byStatus = s === "all" 
        ? byDate 
        : byDate.filter((p) => norm(p.paid_status) === norm(s));

      // Sort by paid status
      byStatus.sort((a, b) => {
        const as = STATUS_ORDER[norm(a.paid_status)] ?? 99;
        const bs = STATUS_ORDER[norm(b.paid_status)] ?? 99;
        return as - bs;
      });

      setRows(byStatus);

      // Calculate counts and summaries
      let paid = 0, unpaid = 0, partial = 0;
      let paidTotal = 0, unpaidTotal = 0, partialPaid = 0, partialRemaining = 0;

      // Use byStatus instead of byDate to respect the status filter in charts/summaries
      byStatus.forEach((p) => {
        const ps = norm(p.paid_status);
        const feePaid = parseFloat(p.fee_paid) || 0;
        const discountedFee = parseFloat(p.discounted_fee) || 0;
        
        if (ps === "paid") {
          paid++;
          paidTotal += feePaid;
        } else if (ps === "partially paid") {
          partial++;
          partialPaid += feePaid;
          partialRemaining += (discountedFee - feePaid);
        } else {
          // unpaid or not paid
          unpaid++;
          unpaidTotal += discountedFee;
        }
      });

      setCounts({ paid, unpaid, partial });
      setSummaryData({
        paid: { count: paid, total: paidTotal },
        unpaid: { count: unpaid, total: unpaidTotal },
        partial: { count: partial, paid: partialPaid, remaining: partialRemaining }
      });
    } catch (e) {
      console.error("Error loading payment insights:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData("", "", "all");
  }, []);

  const apply = () => {
    loadData(fromDate, toDate, status);
    setShowFilters(false); // Auto-collapse after apply
  };
  
  const reset = () => {
    setFromDate("");
    setToDate("");
    setStatus("all");
    loadData("", "", "all");
  };

  // Chart data
  const chartData = {
    labels: ['Paid', 'Unpaid', 'Partially Paid'],
    datasets: [{
      label: 'Number of Students',
      data: [counts.paid, counts.unpaid, counts.partial],
      backgroundColor: [COLORS.paid, COLORS.unpaid, COLORS.partial],
      borderColor: [COLORS.paid, COLORS.unpaid, COLORS.partial],
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Payment Status',
        font: { size: 14, weight: 'bold' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0
        }
      }
    }
  };

  const renderSummaryCard = () => {
    if (status === "paid") {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <h5 className="text-base font-semibold text-green-800 mb-2">Paid Students Summary</h5>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-600">Total Paid</p>
              <p className="text-xl font-bold text-green-700">{summaryData.paid.count}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Amount</p>
              <p className="text-xl font-bold text-green-700">{moneyIN(summaryData.paid.total)}</p>
            </div>
          </div>
        </div>
      );
    }

    if (status === "unpaid") {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <h5 className="text-base font-semibold text-red-800 mb-2">Unpaid Students</h5>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-600">Total Unpaid</p>
              <p className="text-xl font-bold text-red-700">{summaryData.unpaid.count}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Amount Due</p>
              <p className="text-xl font-bold text-red-700">{moneyIN(summaryData.unpaid.total)}</p>
            </div>
          </div>
        </div>
      );
    }

    if (status === "partially paid") {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
          <h5 className="text-base font-semibold text-yellow-800 mb-2">Partial Payments</h5>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-600">Students</p>
              <p className="text-lg font-bold text-yellow-700">{summaryData.partial.count}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Paid</p>
              <p className="text-lg font-bold text-yellow-700">{moneyIN(summaryData.partial.paid)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Due</p>
              <p className="text-lg font-bold text-yellow-700">{moneyIN(summaryData.partial.remaining)}</p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* HEADER with Collapsible Filters */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Payment Insights</h2>
            <p className="text-xs text-gray-500 mt-0.5">Track student payment statuses</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
          >
            <FiFilter size={16} />
            <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            {showFilters ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </button>
        </div>

        {/* Collapsible Filter Bar */}
        {showFilters && (
          <div className="px-6 py-3 bg-gray-50 border-t">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  From Date
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  To Date
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Payment Status
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partially paid">Partially Paid</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={apply}
                  className="px-5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium text-sm transition-colors shadow-sm"
                >
                  Apply
                </button>
                <button
                  onClick={reset}
                  className="px-5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium text-sm transition-colors shadow-sm"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-hidden p-6 flex gap-6">
        {/* LEFT: Chart */}
        <div className="w-80 bg-white border rounded-lg shadow-sm p-4 flex-shrink-0">
          <div style={{ height: '500px' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* RIGHT: Table */}
        <div className="flex-1 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-4">
            {renderSummaryCard()}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-gray-100">
                  <tr className="text-gray-700">
                    {["ID", "Name", "Actual Fee", "Discounted Fee", "Paid", "Lead Status", "Payment Status"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold border border-gray-200 text-xs">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                          Loading…
                        </div>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    rows.map((p, idx) => (
                      <tr key={`${p.lead_id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 border border-gray-200 text-xs">{p.lead_id}</td>
                        <td className="px-3 py-2 border border-gray-200 text-xs truncate max-w-[150px]" title={p.name}>{p.name}</td>
                        <td className="px-3 py-2 border border-gray-200 text-xs">{moneyIN(p.actual_fee)}</td>
                        <td className="px-3 py-2 border border-gray-200 text-xs">{moneyIN(p.discounted_fee)}</td>
                        <td className="px-3 py-2 border border-gray-200 text-xs font-medium">{moneyIN(p.fee_paid)}</td>
                        <td className="px-3 py-2 border border-gray-200 text-xs">
                          <span className="inline-block px-2 py-1 text-[10px] rounded-full bg-blue-100 text-blue-800 capitalize">
                            {(p.status || '').replace(/([a-z])([A-Z])/g, '$1 $2')}
                          </span>
                        </td>
                        <td className="px-3 py-2 border border-gray-200 text-xs">
                          <span className={`inline-block px-2 py-1 text-[10px] rounded-full font-medium capitalize ${
                            norm(p.paid_status) === 'paid' 
                              ? 'bg-green-100 text-green-800'
                              : norm(p.paid_status) === 'partially paid'
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
        </div>
      </div>
    </div>
  );
}
