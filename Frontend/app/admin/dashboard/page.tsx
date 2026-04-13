"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { OrderTruckSummary, purchaseOrderAPI, truckTrackingAPI, TruckStatus } from "@/lib/api";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

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
  FINAL_DELIVERY: "Receiving Received",
  REJECTED: "Rejected",
};

const IN_PROGRESS_STATUSES: POStatus[] = ["ACCEPTED", "PICKING", "PACKING", "SORTING", "SHIPPING"];

const NEXT_STATUS: Partial<Record<POStatus, POStatus>> = {
  ACCEPTED: "PICKING",
  PICKING: "PACKING",
  PACKING: "SORTING",
  SORTING: "SHIPPING",
};

const TRUCK_STATUS_LABEL: Record<TruckStatus, string> = {
  UNDER_LOADING: "UnderLoading",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
  RECEIVING: "Receiving",
};

const NEXT_TRUCK_STATUS: Partial<Record<TruckStatus, TruckStatus>> = {
  UNDER_LOADING: "DISPATCHED",
  DISPATCHED: "DELIVERED",
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
  receivingReceived: Order[];
  rejected: Order[];
};

type NotificationTone = "success" | "error";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading, isAdmin } = useAuth();
  const [orders, setOrders] = useState<OrderBuckets>({ pending: [], inProgress: [], delivered: [], receivingReceived: [], rejected: [] });
  const [counts, setCounts] = useState({ pending: 0, inProgress: 0, delivered: 0, receivingPending: 0, receivingReceived: 0, rejected: 0, total: 0 });
  const [activeTab, setActiveTab] = useState<"pending" | "inProgress" | "delivered" | "rejected" | "receivingPending" | "receivingReceived">("pending");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [noteByOrder, setNoteByOrder] = useState<Record<string, string>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [truckSummaryByOrder, setTruckSummaryByOrder] = useState<Record<string, OrderTruckSummary>>({});
  const [allocationCountByOrder, setAllocationCountByOrder] = useState<Record<string, string>>({});
  const [allocationRowsByOrder, setAllocationRowsByOrder] = useState<
    Record<string, Array<{ truckNumber: string; lineItemId: string }>>
  >({});
  const [deliveredQtyByTruck, setDeliveredQtyByTruck] = useState<Record<string, string>>({});
  const [loadingTruckSummary, setLoadingTruckSummary] = useState(false);
  const [notification, setNotification] = useState<{ message: string; tone: NotificationTone } | null>(null);

  const notify = (message: string, tone: NotificationTone = "success") => {
    setNotification({ message, tone });
  };

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setNotification(null);
    }, 2600);

    return () => clearTimeout(timeoutId);
  }, [notification]);

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
        receivingReceived: data.receivingReceived || [],
        rejected: data.rejected || [],
      });

      const allOrders = [
        ...(data.pending || []),
        ...(data.inProgress || data.accepted || []),
        ...(data.delivered || []),
        ...(data.receivingReceived || []),
        ...(data.rejected || []),
      ];

      const orderIds = allOrders.map((order: Order) => order.id);
      if (orderIds.length > 0) {
        const summaryResponse = await truckTrackingAPI.getSummariesForOrders(token, orderIds);
        const summaryMap = summaryResponse.data || {};
        setTruckSummaryByOrder(summaryMap);

        const uniqueOrders = Array.from(new Map(allOrders.map((order: Order) => [order.id, order])).values()) as Order[];

        const isDeliveredByOrder = (order: Order) => {
          if (order.status === "FINAL_DELIVERY") {
            return false;
          }
          const trucks = summaryMap[order.id]?.trucks || [];
          return order.status === "SHIPPING" || trucks.some((truck: any) => truck.status === "DELIVERED");
        };

        const receivingPendingCount = uniqueOrders.filter((order) => {
          const trucks = summaryMap[order.id]?.trucks || [];
          const pendingTruckCount = trucks.filter((truck: any) => truck.status === "DELIVERED" && truck.userReceivingUpdatedAt == null).length;
          return order.status !== "FINAL_DELIVERY" && (pendingTruckCount > 0 || summaryMap[order.id]?.canFinalizeReceiving);
        }).length;

        setCounts({
          pending: uniqueOrders.filter((order) => order.status === "PENDING").length,
          inProgress: uniqueOrders.filter((order) => ["ACCEPTED", "PICKING", "PACKING", "SORTING"].includes(order.status)).length,
          delivered: uniqueOrders.filter((order) => isDeliveredByOrder(order)).length,
          receivingPending: receivingPendingCount,
          receivingReceived: uniqueOrders.filter((order) => order.status === "FINAL_DELIVERY").length,
          rejected: uniqueOrders.filter((order) => order.status === "REJECTED").length,
          total: uniqueOrders.length,
        });
      } else {
        setTruckSummaryByOrder({});
        setCounts({ pending: 0, inProgress: 0, delivered: 0, receivingPending: 0, receivingReceived: 0, rejected: 0, total: 0 });
      }
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
    }, 60000);

    return () => clearInterval(intervalId);
  }, [token, isAdmin]);

  const allOrders = useMemo(() => {
    const flattened = [
      ...orders.pending,
      ...orders.inProgress,
      ...orders.delivered,
      ...orders.receivingReceived,
      ...orders.rejected,
    ];

    return Array.from(new Map(flattened.map((order) => [order.id, order])).values()) as Order[];
  }, [orders]);

  function isReceivingReceivedOrder(orderId: string) {
    const order = allOrders.find((entry) => entry.id === orderId);
    return order?.status === "FINAL_DELIVERY";
  }

  function isDeliveredOrder(order: Order) {
    if (order.status === "FINAL_DELIVERY") {
      return false;
    }
    const summary = truckSummaryByOrder[order.id];
    const hasDeliveredTruck = (summary?.trucks || []).some((truck) => truck.status === "DELIVERED");
    return order.status === "SHIPPING" || hasDeliveredTruck;
  }

  const currentOrders = useMemo(() => {
    if (activeTab === "pending") {
      return allOrders.filter((order) => order.status === "PENDING");
    }
    if (activeTab === "inProgress") {
      return allOrders.filter((order) => ["ACCEPTED", "PICKING", "PACKING", "SORTING"].includes(order.status));
    }
    if (activeTab === "delivered") {
      return allOrders.filter((order) => isDeliveredOrder(order));
    }
    if (activeTab === "receivingPending") {
      return allOrders.filter((order) => {
        const summary = truckSummaryByOrder[order.id];
        return order.status !== "FINAL_DELIVERY" && (getReceivingPendingTruckCount(order.id) > 0 || summary?.canFinalizeReceiving);
      });
    }
    if (activeTab === "receivingReceived") {
      return allOrders.filter((order) => order.status === "FINAL_DELIVERY");
    }
    if (activeTab === "rejected") {
      return allOrders.filter((order) => order.status === "REJECTED");
    }
    return allOrders;
  }, [activeTab, allOrders, truckSummaryByOrder]);

  const updateStatus = async (orderId: string, status: POStatus) => {
    if (!token) {
      return;
    }

    try {
      await purchaseOrderAPI.updateStatus(token, orderId, status, noteByOrder[orderId] || "");
      await loadData();
      notify(`PO moved to ${STATUS_LABEL[status]}`, "success");
    } catch (err: any) {
      const message = err.message || "Failed to update order status";
      setError(message);
      notify(message, "error");
    }
  };

  function getReceivingPendingTruckCount(orderId: string) {
    const summary = truckSummaryByOrder[orderId];
    if (!summary) return 0;
    return summary.trucks.filter((t) => t.status === "DELIVERED" && t.userReceivingUpdatedAt == null).length;
  }

  const remainingQuantityForOrder = (orderId: string) => {
    const summary = truckSummaryByOrder[orderId];
    if (!summary) {
      return "-";
    }

    return `${summary.remainingTotalQuantity.toFixed(3)} MT`;
  };

  const loadTruckSummaryForSelectedOrder = async (orderId: string) => {
    if (!token) {
      return;
    }

    setLoadingTruckSummary(true);
    try {
      const response = await truckTrackingAPI.getOrderSummary(token, orderId);
      setTruckSummaryByOrder((prev) => ({ ...prev, [orderId]: response.data }));
    } catch (err: any) {
      setError(err.message || "Failed to load truck summary");
    } finally {
      setLoadingTruckSummary(false);
    }
  };

  useEffect(() => {
    if (!selectedOrder || !token) {
      return;
    }

    if (!truckSummaryByOrder[selectedOrder.id]) {
      loadTruckSummaryForSelectedOrder(selectedOrder.id);
    }
  }, [selectedOrder, token]);

  const allocateTrucks = async (orderId: string) => {
    if (!token) {
      return;
    }

    const count = Number(allocationCountByOrder[orderId] || 0);
    const allocations = allocationRowsByOrder[orderId] || [];

    if (!count || count <= 0) {
      const message = "Please enter a valid truck count";
      setError(message);
      notify(message, "error");
      return;
    }

    if (allocations.length !== count) {
      const message = `You entered ${allocations.length} truck rows, but truck count is ${count}`;
      setError(message);
      notify(message, "error");
      return;
    }

    const missingDetails = allocations.some(
      (entry) => !String(entry.truckNumber || "").trim() || !String(entry.lineItemId || "").trim()
    );

    if (missingDetails) {
      const message = "Please enter truck number and material for each truck row";
      setError(message);
      notify(message, "error");
      return;
    }

    try {
      const response = await truckTrackingAPI.allocateTrucks(token, orderId, count, allocations);
      setTruckSummaryByOrder((prev) => ({ ...prev, [orderId]: response.data }));
      setAllocationCountByOrder((prev) => ({ ...prev, [orderId]: "" }));
      setAllocationRowsByOrder((prev) => ({ ...prev, [orderId]: [] }));
      setError("");
      notify(response.message || "Trucks allocated successfully", "success");
    } catch (err: any) {
      const message = err.message || "Failed to allocate trucks";
      setError(message);
      notify(message, "error");
    }
  };

  const updateTruckStatus = async (orderId: string, truckId: string, status: TruckStatus) => {
    if (!token) {
      return;
    }

    try {
      const response = await truckTrackingAPI.updateTruckStatus(token, orderId, truckId, status);
      setTruckSummaryByOrder((prev) => ({ ...prev, [orderId]: response.data }));
      setError("");
      notify(`Truck moved to ${TRUCK_STATUS_LABEL[status]}`, "success");
    } catch (err: any) {
      const message = err.message || "Failed to update truck status";
      setError(message);
      notify(message, "error");
    }
  };

  const saveDeliveredItemsForTruck = async (orderId: string, truckId: string) => {
    if (!token) {
      return;
    }

    const quantity = Number(deliveredQtyByTruck[truckId] || 0);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      const message = "Please enter delivered quantity for this truck material";
      setError(message);
      notify(message, "error");
      return;
    }

    try {
      const response = await truckTrackingAPI.setTruckDeliveredItems(token, orderId, truckId, quantity);
      setTruckSummaryByOrder((prev) => ({ ...prev, [orderId]: response.data }));
      setError("");
      notify(response.message || "Delivered quantities saved successfully", "success");
    } catch (err: any) {
      const message = err.message || "Failed to save delivered quantities";
      setError(message);
      notify(message, "error");
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
      {notification && (
        <div className="fixed right-4 top-4 z-100 w-90 max-w-[calc(100vw-2rem)]">
          <div
            className={`rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${
              notification.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <div className="flex items-start gap-3">
              {notification.tone === "success" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              )}
              <p className="flex-1 text-sm font-medium leading-5">{notification.message}</p>
              <button
                onClick={() => setNotification(null)}
                className="rounded p-1 opacity-80 transition hover:bg-black/5 hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Pending</p><p className="mt-1 text-3xl font-bold text-yellow-600">{counts.pending}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">In Progress</p><p className="mt-1 text-3xl font-bold text-blue-600">{counts.inProgress}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Delivered</p><p className="mt-1 text-3xl font-bold text-green-600">{counts.delivered}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Receiving Pending</p><p className="mt-1 text-3xl font-bold text-orange-600">{counts.receivingPending}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Receiving Received</p><p className="mt-1 text-3xl font-bold text-emerald-600">{counts.receivingReceived}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Rejected</p><p className="mt-1 text-3xl font-bold text-red-600">{counts.rejected}</p></div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Total</p><p className="mt-1 text-3xl font-bold text-gray-700">{counts.total}</p></div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="mb-4 flex flex-wrap gap-2">
            <button onClick={() => setActiveTab("pending")} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${activeTab === "pending" ? "bg-yellow-200 text-yellow-900" : "bg-gray-100 text-gray-700"}`}>Pending</button>
            <button onClick={() => setActiveTab("inProgress")} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${activeTab === "inProgress" ? "bg-blue-200 text-blue-900" : "bg-gray-100 text-gray-700"}`}>In Progress</button>
            <button onClick={() => setActiveTab("delivered")} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${activeTab === "delivered" ? "bg-green-200 text-green-900" : "bg-gray-100 text-gray-700"}`}>Delivered</button>
            <button onClick={() => setActiveTab("receivingPending")} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${activeTab === "receivingPending" ? "bg-orange-200 text-orange-900" : "bg-gray-100 text-gray-700"}`}>
              Receiving Pending {counts.receivingPending > 0 && <span className="ml-1 inline-block rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">{counts.receivingPending}</span>}
            </button>
            <button onClick={() => setActiveTab("receivingReceived")} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${activeTab === "receivingReceived" ? "bg-emerald-200 text-emerald-900" : "bg-gray-100 text-gray-700"}`}>
              Receiving Received
            </button>
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
                const isExpanded = selectedOrder?.id === order.id;

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
                        <p>Remaining Qty: {remainingQuantityForOrder(order.id)}</p>
                        <p>Trucks: {truckSummaryByOrder[order.id]?.truckCount || 0}</p>
                        <p>Submitted: {new Date(order.createdAt).toLocaleString()}</p>
                        <button
                          onClick={() => setSelectedOrder((prev) => (prev?.id === order.id ? null : order))}
                          className="mt-2 rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                        >
                          {isExpanded ? "Hide Details" : "View Details"}
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

                    {isExpanded && (
                      <div className="mt-5 rounded-xl border border-gray-200 bg-white p-6">
                        <div className="mb-3 flex items-center justify-between">
                          <h2 className="text-xl font-bold text-gray-900">PO Details: #{order.poNumber}</h2>
                          <button
                            onClick={() => setSelectedOrder(null)}
                            className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                          >
                            Close
                          </button>
                        </div>

                        <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
                          <p><span className="font-semibold">Buyer:</span> {order.companyName}</p>
                          <p><span className="font-semibold">Buyer Address:</span> {order.companyAddress}</p>
                          <p><span className="font-semibold">Buyer City/State/Zip:</span> {order.companyCityStateZip}</p>
                          <p><span className="font-semibold">Buyer Country:</span> {order.companyCountry}</p>
                          <p><span className="font-semibold">Buyer Contact:</span> {order.companyContact || "-"}</p>
                          <p><span className="font-semibold">Vendor:</span> {order.vendorName}</p>
                          <p><span className="font-semibold">Vendor Address:</span> {order.vendorAddress}</p>
                          <p><span className="font-semibold">Vendor City/State/Zip:</span> {order.vendorCityStateZip}</p>
                          <p><span className="font-semibold">Vendor Country:</span> {order.vendorCountry}</p>
                          <p><span className="font-semibold">Order Date:</span> {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "-"}</p>
                          <p><span className="font-semibold">Delivery Date:</span> {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "-"}</p>
                          <p><span className="font-semibold">Sub Total:</span> INR {Number(order.subTotal || 0).toFixed(2)}</p>
                          <p><span className="font-semibold">Total:</span> INR {Number(order.total || 0).toFixed(2)}</p>
                          <p><span className="font-semibold">Status:</span> {STATUS_LABEL[order.status]}</p>
                          <p><span className="font-semibold">Submitted:</span> {new Date(order.createdAt).toLocaleString()}</p>
                          <p><span className="font-semibold">User:</span> {order.user?.name || "-"} ({order.user?.email || "-"})</p>
                          <p><span className="font-semibold">Reviewed At:</span> {order.reviewedAt ? new Date(order.reviewedAt).toLocaleString() : "-"}</p>
                          <p><span className="font-semibold">Reviewed By:</span> {order.reviewedBy ? `${order.reviewedBy.name} (${order.reviewedBy.email})` : "-"}</p>
                          <p><span className="font-semibold">Review Note:</span> {order.reviewNote || "-"}</p>
                          <p><span className="font-semibold">Remaining Quantity:</span> {remainingQuantityForOrder(order.id)}</p>
                        </div>

                        <div className="mt-5 rounded-xl border border-gray-200 p-4">
                          <h3 className="mb-3 text-base font-semibold text-gray-900">Truck Management</h3>
                          {loadingTruckSummary ? (
                            <p className="text-sm text-gray-600">Loading truck details...</p>
                          ) : (
                            <>
                              {(order.status === "PACKING" || order.status === "SHIPPING") && (
                                <div className="mb-4 grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 md:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-xs font-semibold text-gray-700">Number of trucks</label>
                                    <input
                                      type="number"
                                      min={1}
                                      value={allocationCountByOrder[order.id] || ""}
                                      onChange={(e) => {
                                        const nextCountValue = e.target.value;
                                        setAllocationCountByOrder((prev) => ({ ...prev, [order.id]: nextCountValue }));

                                        const nextCount = Number(nextCountValue || 0);
                                        const previousRows = allocationRowsByOrder[order.id] || [];

                                        const nextRows = Array.from({ length: Math.max(nextCount, 0) }, (_, index) => ({
                                          truckNumber: previousRows[index]?.truckNumber || "",
                                          lineItemId: previousRows[index]?.lineItemId || "",
                                        }));

                                        setAllocationRowsByOrder((prev) => ({ ...prev, [order.id]: nextRows }));
                                      }}
                                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                      placeholder="e.g. 5"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="mb-2 block text-xs font-semibold text-gray-700">Truck rows with material (one material per truck)</label>
                                    <div className="space-y-2">
                                      {(allocationRowsByOrder[order.id] || []).map((row, index) => (
                                        <div key={`${order.id}-alloc-${index}`} className="grid gap-2 md:grid-cols-2">
                                          <input
                                            value={row.truckNumber}
                                            onChange={(e) =>
                                              setAllocationRowsByOrder((prev) => ({
                                                ...prev,
                                                [order.id]: (prev[order.id] || []).map((entry, entryIndex) =>
                                                  entryIndex === index
                                                    ? { ...entry, truckNumber: e.target.value.toUpperCase().replace(/\s+/g, "") }
                                                    : entry
                                                ),
                                              }))
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                            placeholder="Truck number (MH02AC2111)"
                                          />
                                          <select
                                            value={row.lineItemId}
                                            onChange={(e) =>
                                              setAllocationRowsByOrder((prev) => ({
                                                ...prev,
                                                [order.id]: (prev[order.id] || []).map((entry, entryIndex) =>
                                                  entryIndex === index ? { ...entry, lineItemId: e.target.value } : entry
                                                ),
                                              }))
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                          >
                                            <option value="">Select material</option>
                                            {(order.lineItems || []).map((lineItem) => (
                                              <option key={lineItem.id} value={lineItem.id}>
                                                {lineItem.description}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="md:col-span-2">
                                    <button
                                      onClick={() => allocateTrucks(order.id)}
                                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                                    >
                                      Allocate Trucks
                                    </button>
                                  </div>
                                </div>
                              )}

                              {!truckSummaryByOrder[order.id] || truckSummaryByOrder[order.id].truckCount === 0 ? (
                                <p className="text-sm text-gray-600">No trucks allocated yet.</p>
                              ) : (
                                <div className="space-y-3">
                                  {truckSummaryByOrder[order.id].trucks.map((truck) => {
                                    const nextTruckStatus = NEXT_TRUCK_STATUS[truck.status];

                                    return (
                                      <div key={truck.id} className="rounded-lg border border-gray-200 p-3">
                                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <p className="text-sm font-semibold text-gray-900">{truck.truckNumber}</p>
                                              {truck.status === "DELIVERED" && truck.userReceivingUpdatedAt == null && (
                                                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">Receiving Pending</span>
                                              )}
                                            </div>
                                            <p className="text-xs text-gray-600">Status: {TRUCK_STATUS_LABEL[truck.status]}</p>
                                            <p className="text-xs text-gray-600">Material: {truck.materialDescription || "-"}</p>
                                            {truck.userShortageQuantity != null && (
                                              <p className="text-xs text-rose-700">
                                                User reported shortage: {Number(truck.userShortageQuantity).toFixed(3)}
                                              </p>
                                            )}
                                            {truck.userShortageQuantity != null && (
                                              <p className="text-xs text-emerald-700">
                                                User received: {Number(truck.effectiveReceivedQuantity || 0).toFixed(3)}
                                              </p>
                                            )}
                                            {truck.userReceivingNote && (
                                              <p className="text-xs text-gray-600">User note: {truck.userReceivingNote}</p>
                                            )}
                                          </div>
                                          <div className="flex gap-2">
                                            {nextTruckStatus && (
                                              <button
                                                onClick={() => updateTruckStatus(order.id, truck.id, nextTruckStatus)}
                                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                                              >
                                                Move to {TRUCK_STATUS_LABEL[nextTruckStatus]}
                                              </button>
                                            )}
                                          </div>
                                        </div>

                                        {truck.status === "DELIVERED" && (
                                          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                            <p className="mb-2 text-xs font-semibold text-amber-900">
                                              Set delivered quantity for material: {truck.materialDescription || "Assigned Material"}
                                            </p>
                                            <div className="flex items-center gap-2">
                                              <label className="w-40 text-xs text-gray-700">Quantity</label>
                                              <input
                                                type="number"
                                                min={0}
                                                step="0.001"
                                                value={deliveredQtyByTruck[truck.id] || ""}
                                                onChange={(e) =>
                                                  setDeliveredQtyByTruck((prev) => ({
                                                    ...prev,
                                                    [truck.id]: e.target.value,
                                                  }))
                                                }
                                                className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                                                placeholder="0"
                                              />
                                            </div>
                                            <button
                                              onClick={() => saveDeliveredItemsForTruck(order.id, truck.id)}
                                              className="mt-3 rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                                            >
                                              Save Delivered Quantities
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        <div className="mt-5 rounded-xl border border-gray-200 p-4">
                          <h3 className="mb-2 text-base font-semibold text-gray-900">Remaining Quantity</h3>
                          {!truckSummaryByOrder[order.id] || truckSummaryByOrder[order.id].remainingByItem.length === 0 ? (
                            <p className="text-sm text-gray-600">No remaining quantity data available.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full border border-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="border border-gray-200 px-3 py-2 text-left">Item</th>
                                    <th className="border border-gray-200 px-3 py-2 text-right">Ordered</th>
                                    <th className="border border-gray-200 px-3 py-2 text-right">Delivered</th>
                                    <th className="border border-gray-200 px-3 py-2 text-right">Remaining</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {truckSummaryByOrder[order.id].remainingByItem.map((item) => (
                                    <tr key={item.lineItemId}>
                                      <td className="border border-gray-200 px-3 py-2">{item.description}</td>
                                      <td className="border border-gray-200 px-3 py-2 text-right">{item.orderedQuantity}</td>
                                      <td className="border border-gray-200 px-3 py-2 text-right">{item.deliveredQuantity.toFixed(3)}</td>
                                      <td className="border border-gray-200 px-3 py-2 text-right">{item.remainingQuantity.toFixed(3)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        <div className="mt-5">
                          <h3 className="mb-2 text-base font-semibold text-gray-900">Line Items</h3>
                          {!order.lineItems || order.lineItems.length === 0 ? (
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
                                  {order.lineItems.map((item) => (
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
