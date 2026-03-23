"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { purchaseOrderAPI } from "@/lib/api";

type POStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PICKING"
  | "PACKING"
  | "SORTING"
  | "SHIPPING"
  | "FINAL_DELIVERY"
  | "REJECTED";

const STATUS_LABEL: Record<POStatus, string> = {
  PENDING: "Approval Pending",
  ACCEPTED: "PO Approved",
  PICKING: "Order Placed",
  PACKING: "UnderLoading",
  SORTING: "Dispatched",
  SHIPPING: "Delivered",
  FINAL_DELIVERY: "Receiving",
  REJECTED: "Rejected",
};

const IN_PROGRESS_STATUSES: POStatus[] = ["ACCEPTED", "PICKING", "PACKING", "SORTING", "SHIPPING"];

const NEXT_STATUS: Partial<Record<POStatus, POStatus>> = {
  ACCEPTED: "PICKING",
  PICKING: "PACKING",
  PACKING: "SORTING",
  SORTING: "SHIPPING",
  SHIPPING: "FINAL_DELIVERY",
};

type Order = {
  id: string;
  poNumber: string;
  vendorName: string;
  vendorAddress: string;
  vendorCityStateZip: string;
  vendorCountry: string;
  companyName: string;
  companyAddress: string;
  companyCityStateZip: string;
  companyCountry: string;
  companyContact?: string | null;
  orderDate?: string | null;
  deliveryDate?: string | null;
  subTotal: number;
  taxRate?: number | null;
  taxAmount?: number | null;
  total: number;
  status: POStatus;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  lineItems?: Array<{
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    gst?: number | null;
  }>;
  user?: {
    name: string;
    email: string;
  };
};

type OrderBuckets = {
  pending: Order[];
  inProgress: Order[];
  delivered: Order[];
  rejected: Order[];
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading, isAdmin } = useAuth();
  const [orders, setOrders] = useState<OrderBuckets>({ pending: [], inProgress: [], delivered: [], rejected: [] });
  const [counts, setCounts] = useState({ pending: 0, inProgress: 0, delivered: 0, rejected: 0, total: 0 });
  const [activeTab, setActiveTab] = useState<"pending" | "inProgress" | "delivered" | "rejected">("pending");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [noteByOrder, setNoteByOrder] = useState<Record<string, string>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }

    if (!isLoading && isAuthenticated && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const loadData = async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await purchaseOrderAPI.getAdminDashboard(token);
      const data = response.data || {};
      const responseCounts = response.counts || {};

      setOrders({
        pending: data.pending || [],
        inProgress: data.inProgress || data.accepted || [],
        delivered: data.delivered || [],
        rejected: data.rejected || [],
      });

      setCounts({
        pending: responseCounts.pending || 0,
        inProgress: responseCounts.inProgress || responseCounts.accepted || 0,
        delivered: responseCounts.delivered || 0,
        rejected: responseCounts.rejected || 0,
        total: responseCounts.total || 0,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && isAdmin) {
      loadData();
    }
  }, [token, isAdmin]);

  useEffect(() => {
    if (!token || !isAdmin) {
      return;
    }

    const intervalId = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [token, isAdmin]);

  const currentOrders = useMemo(() => orders[activeTab] || [], [orders, activeTab]);

  const updateStatus = async (orderId: string, status: POStatus) => {
    if (!token) {
      return;
    }

    try {
      await purchaseOrderAPI.updateStatus(token, orderId, status, noteByOrder[orderId] || "");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update order status");
    }
  };

  const statusBadgeClass = (status: POStatus) => {
    if (status === "FINAL_DELIVERY") {
      return "bg-green-100 text-green-700";
    }
    if (status === "REJECTED") {
      return "bg-red-100 text-red-700";
    }
    if (IN_PROGRESS_STATUSES.includes(status)) {
      return "bg-blue-100 text-blue-700";
    }
    return "bg-yellow-100 text-yellow-700";
  };

  if (isLoading || !isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage purchase orders from approval to final delivery.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadData} className="rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-black">Refresh</button>
            <Link href="/" className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100">
              Back to Home
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Pending</p><p className="mt-1 text-3xl font-bold text-yellow-600">{counts.pending}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">In Progress</p><p className="mt-1 text-3xl font-bold text-blue-600">{counts.inProgress}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Delivered</p><p className="mt-1 text-3xl font-bold text-green-600">{counts.delivered}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Rejected</p><p className="mt-1 text-3xl font-bold text-red-600">{counts.rejected}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Total</p><p className="mt-1 text-3xl font-bold text-gray-700">{counts.total}</p></div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="mb-4 flex flex-wrap gap-2">
            <button onClick={() => setActiveTab("pending")} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${activeTab === "pending" ? "bg-yellow-200 text-yellow-900" : "bg-gray-100 text-gray-700"}`}>Pending</button>
            <button onClick={() => setActiveTab("inProgress")} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${activeTab === "inProgress" ? "bg-blue-200 text-blue-900" : "bg-gray-100 text-gray-700"}`}>In Progress</button>
            <button onClick={() => setActiveTab("delivered")} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${activeTab === "delivered" ? "bg-green-200 text-green-900" : "bg-gray-100 text-gray-700"}`}>Delivered</button>
            <button onClick={() => setActiveTab("rejected")} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${activeTab === "rejected" ? "bg-red-200 text-red-900" : "bg-gray-100 text-gray-700"}`}>Rejected</button>
          </div>

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : currentOrders.length === 0 ? (
            <p className="text-gray-500">No orders in this category.</p>
          ) : (
            <div className="space-y-4">
              {currentOrders.map((order) => {
                const nextStatus = NEXT_STATUS[order.status];

                return (
                  <div key={order.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">PO #{order.poNumber}</p>
                        <p className="text-sm text-gray-600">User: {order.user?.name} ({order.user?.email})</p>
                        <p className="text-sm text-gray-600">Buyer: {order.companyName} | Vendor: {order.vendorName}</p>
                        <div className="mt-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(order.status)}`}>
                            {STATUS_LABEL[order.status]}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Total: INR {Number(order.total || 0).toFixed(2)}</p>
                        <p>Submitted: {new Date(order.createdAt).toLocaleString()}</p>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="mt-2 rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                        >
                          View Details
                        </button>
                      </div>
                    </div>

                    {(order.status === "PENDING" || nextStatus) && (
                      <div className="mt-3 space-y-2">
                        <input
                          value={noteByOrder[order.id] || ""}
                          onChange={(e) => setNoteByOrder((prev) => ({ ...prev, [order.id]: e.target.value }))}
                          placeholder="Internal note (optional)"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />

                        {order.status === "PENDING" ? (
                          <div className="flex gap-2">
                            <button onClick={() => updateStatus(order.id, "ACCEPTED")} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">Accept</button>
                            <button onClick={() => updateStatus(order.id, "REJECTED")} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Reject</button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => nextStatus && updateStatus(order.id, nextStatus)}
                              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                              Move to {nextStatus ? STATUS_LABEL[nextStatus] : "Next"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {!nextStatus && order.status !== "PENDING" && (
                      <p className="mt-3 text-sm text-gray-600">Note: {order.reviewNote || "-"}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedOrder && (
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">PO Details: #{selectedOrder.poNumber}</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
              <p><span className="font-semibold">Buyer:</span> {selectedOrder.companyName}</p>
              <p><span className="font-semibold">Buyer Address:</span> {selectedOrder.companyAddress}</p>
              <p><span className="font-semibold">Buyer City/State/Zip:</span> {selectedOrder.companyCityStateZip}</p>
              <p><span className="font-semibold">Buyer Country:</span> {selectedOrder.companyCountry}</p>
              <p><span className="font-semibold">Buyer Contact:</span> {selectedOrder.companyContact || "-"}</p>
              <p><span className="font-semibold">Vendor:</span> {selectedOrder.vendorName}</p>
              <p><span className="font-semibold">Vendor Address:</span> {selectedOrder.vendorAddress}</p>
              <p><span className="font-semibold">Vendor City/State/Zip:</span> {selectedOrder.vendorCityStateZip}</p>
              <p><span className="font-semibold">Vendor Country:</span> {selectedOrder.vendorCountry}</p>
              <p><span className="font-semibold">Order Date:</span> {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleDateString() : "-"}</p>
              <p><span className="font-semibold">Delivery Date:</span> {selectedOrder.deliveryDate ? new Date(selectedOrder.deliveryDate).toLocaleDateString() : "-"}</p>
              <p><span className="font-semibold">Sub Total:</span> INR {Number(selectedOrder.subTotal || 0).toFixed(2)}</p>
              <p><span className="font-semibold">Total:</span> INR {Number(selectedOrder.total || 0).toFixed(2)}</p>
              <p><span className="font-semibold">Status:</span> {STATUS_LABEL[selectedOrder.status]}</p>
              <p><span className="font-semibold">Submitted:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              <p><span className="font-semibold">User:</span> {selectedOrder.user?.name || "-"} ({selectedOrder.user?.email || "-"})</p>
              <p><span className="font-semibold">Reviewed At:</span> {selectedOrder.reviewedAt ? new Date(selectedOrder.reviewedAt).toLocaleString() : "-"}</p>
              <p><span className="font-semibold">Reviewed By:</span> {selectedOrder.reviewedBy ? `${selectedOrder.reviewedBy.name} (${selectedOrder.reviewedBy.email})` : "-"}</p>
              <p><span className="font-semibold">Review Note:</span> {selectedOrder.reviewNote || "-"}</p>
            </div>

            <div className="mt-5">
              <h3 className="mb-2 text-base font-semibold text-gray-900">Line Items</h3>
              {!selectedOrder.lineItems || selectedOrder.lineItems.length === 0 ? (
                <p className="text-sm text-gray-600">No line items available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-200 px-3 py-2 text-left">Description</th>
                        <th className="border border-gray-200 px-3 py-2 text-right">Qty</th>
                        <th className="border border-gray-200 px-3 py-2 text-right">Rate</th>
                        <th className="border border-gray-200 px-3 py-2 text-right">GST %</th>
                        <th className="border border-gray-200 px-3 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.lineItems.map((item) => (
                        <tr key={item.id}>
                          <td className="border border-gray-200 px-3 py-2">{item.description}</td>
                          <td className="border border-gray-200 px-3 py-2 text-right">{item.quantity}</td>
                          <td className="border border-gray-200 px-3 py-2 text-right">{Number(item.rate || 0).toFixed(2)}</td>
                          <td className="border border-gray-200 px-3 py-2 text-right">{item.gst != null ? item.gst : 0}</td>
                          <td className="border border-gray-200 px-3 py-2 text-right">{Number(item.amount || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
