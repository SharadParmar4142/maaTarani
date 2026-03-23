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
const PO_TRACKING_STEPS: POStatus[] = ["PENDING", "ACCEPTED", "PICKING", "PACKING", "SORTING", "SHIPPING", "FINAL_DELIVERY"];

type Order = {
  id: string;
  uniqueId: string;
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
  lineItems?: Array<{
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    gst?: number | null;
  }>;
  createdAt: string;
};

export default function UserDashboardPage() {
  const router = useRouter();
  const { user, company, token, isAuthenticated, isLoading, isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState({ pending: 0, inProgress: 0, delivered: 0, rejected: 0, total: 0 });
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }

    if (!isLoading && isAdmin) {
      router.push("/admin/dashboard");
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (!token || !isAuthenticated || isAdmin) {
      return;
    }

    const loadOrders = async () => {
      setLoadingOrders(true);
      setError("");
      try {
        const response = await purchaseOrderAPI.getMyOrders(token);
        setOrders(response.data || []);
        setCounts(response.counts || { pending: 0, inProgress: 0, delivered: 0, rejected: 0, total: 0 });
      } catch (err: any) {
        setError(err.message || "Failed to load purchase orders");
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, [token, isAuthenticated, isAdmin]);

  const statusClass = (status: Order["status"]) => {
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

  const getStepIndex = (status: POStatus) => PO_TRACKING_STEPS.findIndex((step) => step === status);

  const cards = useMemo(
    () => [
      { label: "Pending", value: counts.pending, color: "text-yellow-600" },
      { label: "In Progress", value: counts.inProgress, color: "text-blue-600" },
      { label: "Delivered", value: counts.delivered, color: "text-green-600" },
      { label: "Rejected", value: counts.rejected, color: "text-red-600" },
      { label: "Total", value: counts.total, color: "text-gray-700" },
    ],
    [counts]
  );

  if (isLoading || !isAuthenticated || isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Dashboard</h1>
            <p className="text-gray-600">Track your purchase orders and update optional profile details.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/purchase-order" className="rounded-lg bg-[#c41e3a] px-4 py-2 font-semibold text-white hover:bg-[#a01830]">
              Create Purchase Order
            </Link>
            <Link href="/" className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100">
              Back to Home
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className={`mt-1 text-3xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Order Tracking</h2>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {loadingOrders ? (
            <p className="mt-4 text-gray-500">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="mt-4 text-gray-500">No purchase orders found yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2">PO #</th>
                    <th className="px-3 py-2">Vendor</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Submitted</th>
                    <th className="px-3 py-2">Review Note</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b">
                      <td className="px-3 py-2 font-medium text-gray-900">{order.poNumber}</td>
                      <td className="px-3 py-2">{order.vendorName}</td>
                      <td className="px-3 py-2">INR {Number(order.total || 0).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(order.status)}`}>
                          {STATUS_LABEL[order.status]}
                        </span>
                      </td>
                      <td className="px-3 py-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2">{order.reviewNote || "-"}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

            <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-800">Order Progress</p>
              {selectedOrder.status === "REJECTED" ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  This PO was rejected and is no longer progressing.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="flex min-w-190 items-start justify-between gap-2">
                    {PO_TRACKING_STEPS.map((step, index) => {
                      const currentIndex = getStepIndex(selectedOrder.status);
                      const isCompleted = currentIndex > index;
                      const isCurrent = currentIndex === index;

                      return (
                        <div key={step} className="flex flex-1 items-start">
                          <div className="flex flex-col items-center text-center">
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                                isCompleted
                                  ? "border-green-600 bg-green-600 text-white"
                                  : isCurrent
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-gray-300 bg-white text-gray-500"
                              }`}
                            >
                              {index + 1}
                            </span>
                            <span
                              className={`mt-2 text-xs font-semibold ${
                                isCompleted || isCurrent ? "text-gray-900" : "text-gray-500"
                              }`}
                            >
                              {STATUS_LABEL[step]}
                            </span>
                          </div>
                          {index < PO_TRACKING_STEPS.length - 1 && (
                            <div
                              className={`mt-4 h-0.5 flex-1 ${
                                isCompleted ? "bg-green-500" : "bg-gray-300"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
              <p><span className="font-semibold">Reviewed At:</span> {selectedOrder.reviewedAt ? new Date(selectedOrder.reviewedAt).toLocaleString() : "-"}</p>
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
