"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, X, Calendar, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import "./purchase.css";

// @ts-ignore - jsPDF types may not be fully compatible
import { jsPDF } from "jspdf";
// @ts-ignore - jspdf-autotable doesn't have type definitions
import autoTable from "jspdf-autotable";
// @ts-ignore - xlsx types issues
import * as XLSX from "xlsx";

interface Company {
  name: string;
  address: string;
  cityStateZip: string;
  country: string;
  contact: string;
}

interface Vendor {
  name: string;
  address: string;
  cityStateZip: string;
  country: string;
}

interface OrderInfo {
  poNumber: string;
  orderDate: string;
  deliveryDate: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  gst: number;
  amount: number;
}

interface FormData {
  company: Company;
  vendor: Vendor;
  orderInfo: OrderInfo;
  lineItems: LineItem[];
  subTotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

interface ValidationErrors {
  [key: string]: string;
}

interface Modal {
  title: React.ReactNode;
  description: React.ReactNode;
  primaryText?: React.ReactNode;
  secondaryText?: React.ReactNode;
  onPrimary?: () => void;
  onClose?: () => void;
}

export default function PurchaseOrderPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  // Protect the route - redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render the page if not authenticated
  if (!isAuthenticated) {
    return null;
  }
  
  const [formData, setFormData] = useState<FormData>({
    company: {
      name: "",
      address: "",
      cityStateZip: "",
      country: "India",
      contact: "",
    },
    vendor: {
      name: "",
      address: "",
      cityStateZip: "",
      country: "India",
    },
    orderInfo: {
      poNumber: "",
      orderDate: today,
      deliveryDate: today,
    },
    lineItems: [
      {
        id: "1",
        description: "",
        quantity: 0,
        rate: 0.0,
        gst: 0.0,
        amount: 0.0,
      },
    ],
    subTotal: 0.0,
    taxRate: 0,
    taxAmount: 0.0,
    total: 0.0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [modal, setModal] = useState<Modal | null>(null);
  const [rateDisplayValues, setRateDisplayValues] = useState<{ [key: string]: string }>({});
  const [gstDisplayValues, setGstDisplayValues] = useState<{ [key: string]: string }>({});
  const [quantityDisplayValues, setQuantityDisplayValues] = useState<{ [key: string]: string }>({});

  const updateNestedField = (section: "company" | "vendor" | "orderInfo", field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [section]: { ...formData[section], [field]: e.target.value },
    });
  };

  const updateNumericField = (section: "company" | "vendor" | "orderInfo", field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const digitsOnly = String(e.target.value || "").replace(/\D/g, "");
    setFormData({
      ...formData,
      [section]: { ...formData[section], [field]: digitsOnly },
    });
  };

  const calculateTotals = (items: LineItem[]) => {
    const subTotal = items.reduce((sum, item) => sum + item.amount, 0);
    const total = subTotal;
    return { subTotal, taxAmount: 0, total };
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    const updatedItems = formData.lineItems.map((item) => {
      if (item.id === id) {
        let normalizedValue = value;
        if (field === "quantity" || field === "rate" || field === "gst") {
          normalizedValue = Number.isFinite(value) ? Math.max(0, value) : 0;
        }

        const updatedItem = { ...item, [field]: normalizedValue };
        const qty = Number(updatedItem.quantity) || 0;
        const rate = Number(updatedItem.rate) || 0;
        const gst = Number(updatedItem.gst) || 0;
        updatedItem.amount = qty * rate * (1 + gst / 100);
        return updatedItem;
      }
      return item;
    });

    const totals = calculateTotals(updatedItems);
    setFormData({
      ...formData,
      lineItems: updatedItems,
      ...totals,
    });
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 0,
      rate: 0.0,
      gst: 0.0,
      amount: 0.0,
    };
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, newItem],
    });
  };

  const removeLineItem = (id: string) => {
    const updatedItems = formData.lineItems.filter((item) => item.id !== id);
    const totals = calculateTotals(updatedItems);
    setFormData({
      ...formData,
      lineItems: updatedItems,
      ...totals,
    });

    const newRateValues = { ...rateDisplayValues };
    delete newRateValues[id];
    setRateDisplayValues(newRateValues);

    const newGstValues = { ...gstDisplayValues };
    delete newGstValues[id];
    setGstDisplayValues(newGstValues);

    const newQuantityValues = { ...quantityDisplayValues };
    delete newQuantityValues[id];
    setQuantityDisplayValues(newQuantityValues);
  };

  const buildPurchaseOrderPayload = (formData: FormData) => {
    return {
      company: {
        name: formData.company.name,
        address: formData.company.address,
        cityStateZip: formData.company.cityStateZip,
        country: formData.company.country,
        contact: formData.company.contact,
      },
      vendor: {
        name: formData.vendor.name,
        address: formData.vendor.address,
        cityStateZip: formData.vendor.cityStateZip,
        country: formData.vendor.country,
      },
      orderInfo: {
        poNumber: formData.orderInfo.poNumber,
        orderDate: new Date(formData.orderInfo.orderDate).toISOString().split("T")[0],
        deliveryDate: new Date(formData.orderInfo.deliveryDate).toISOString().split("T")[0],
      },
      lineItems: formData.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        gst: item.gst,
        amount: item.amount,
      })),
      subTotal: formData.subTotal,
      taxRate: formData.taxRate,
      taxAmount: formData.taxAmount,
      total: formData.total,
    };
  };

  const checkDuplicate = async () => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const payload = buildPurchaseOrderPayload(formData);
    const resp = await fetch(`${API_BASE_URL}/api/purchaseorder/checkDuplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      throw new Error(`Duplicate check failed (${resp.status})`);
    }
    return resp.json();
  };

  const updateGoogleSheet = async (uniqueId: string) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/api/purchaseorder/updateGoogleSheet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          uniqueId: uniqueId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update Google Sheet: ${errorData.message || "Unknown error"}`);
      }
      console.log("Google Sheet updated successfully");
    } catch (error) {
      console.error("Error updating Google Sheet:", error);
      throw error;
    }
  };

  const validateForm = () => {
    const errors: ValidationErrors = {};

    if (!formData.company.name.trim()) {
      errors.companyName = "Field cannot be empty";
    }
    if (!formData.company.contact || !formData.company.contact.trim()) {
      errors.companyContact = "Field cannot be empty";
    }
    if (!formData.company.address.trim()) {
      errors.companyAddress = "Field cannot be empty";
    }
    if (!formData.company.cityStateZip.trim()) {
      errors.companyCityStateZip = "Field cannot be empty";
    }
    if (!formData.company.country.trim()) {
      errors.companyCountry = "Field cannot be empty";
    }

    if (!formData.vendor.name.trim()) {
      errors.vendorName = "Field cannot be empty";
    }
    if (!formData.vendor.address.trim()) {
      errors.vendorAddress = "Field cannot be empty";
    }
    if (!formData.vendor.cityStateZip.trim()) {
      errors.vendorCityStateZip = "Field cannot be empty";
    }
    if (!formData.vendor.country.trim()) {
      errors.vendorCountry = "Field cannot be empty";
    }

    if (!formData.orderInfo.poNumber.trim()) {
      errors.poNumber = "Field cannot be empty";
    } else if (!/^\d+$/.test(formData.orderInfo.poNumber)) {
      errors.poNumber = "PO Number must be an integer";
    }

    if (formData.company.cityStateZip && !/^\d+$/.test(formData.company.cityStateZip)) {
      errors.companyCityStateZip = "Pincode must be an integer";
    }

    if (formData.vendor.cityStateZip && !/^\d+$/.test(formData.vendor.cityStateZip)) {
      errors.vendorCityStateZip = "Pincode must be an integer";
    }

    formData.lineItems.forEach((item, index) => {
      if (!item.description.trim()) {
        errors[`lineItemDescription_${index}`] = "Field cannot be empty";
      }
      if (item.quantity <= 0) {
        errors[`lineItemQuantity_${index}`] = "Field cannot be empty";
      }
      if (item.rate < 0) {
        errors[`lineItemRate_${index}`] = "Cannot be negative";
      }
      if (item.gst < 0) {
        errors[`lineItemGst_${index}`] = "Cannot be negative";
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const exportToPDF = useCallback(async () => {
    try {
      const isValid = validateForm();
      if (!isValid) {
        console.warn("[PO][UI] Validation failed; blocking exportToPDF");
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const payload = buildPurchaseOrderPayload(formData);

      let newUnique = "";
      let createdNew = false;
      try {
        const dup = await checkDuplicate();
        if (dup?.exists) {
          newUnique = dup.unique_id || "";
        } else {
          const response = await fetch(`${API_BASE_URL}/api/purchaseorder`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (response.ok) {
            const responseData = await response.json();
            newUnique = responseData.unique_id || responseData.data?.unique_id || newUnique;
            createdNew = true;
          } else {
            return;
          }
        }
      } catch (dbErr) {
        console.warn("[PO][UI] Duplicate check/save error during exportToPDF", dbErr);
        return;
      }

      if (createdNew) {
        try {
          await updateGoogleSheet(newUnique);
        } catch (sheetError) {
          console.warn("[PO][UI] Google Sheet update failed during PDF export:", sheetError);
        }
      }

      // Generate PDF (simplified version - full implementation available in original code)
      const doc = new jsPDF();
      const marginX = 15;
      let y = 30;

      doc.setFontSize(16);
      doc.text("PURCHASE ORDER", 105, 20, { align: "center" });

      doc.setFontSize(10);
      doc.text(`Company: ${formData.company.name}`, marginX, y);
      y += 7;
      doc.text(`Address: ${formData.company.address}`, marginX, y);
      y += 7;
      doc.text(`PO Number: ${formData.orderInfo.poNumber}`, marginX, y);
      y += 15;

      autoTable(doc, {
        startY: y,
        head: [["#", "Item", "Qty", "Rate", "GST", "Amount"]],
        body: formData.lineItems.map((item, index) => [
          index + 1,
          item.description,
          item.quantity,
          `INR ${item.rate.toFixed(2)}`,
          `${item.gst}%`,
          `INR ${item.amount.toFixed(2)}`,
        ]),
        theme: "grid",
      });

      doc.save(`purchase-order-${formData.orderInfo.poNumber}.pdf`);
    } catch (error) {
      console.error("[PO][UI] Error exporting to PDF:", error);
    }
  }, [formData]);

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const dup = await checkDuplicate();
      if (dup?.exists) {
        setSubmitStatus("idle");
        setModal({
          title: "Duplicate entry not allowed",
          description: (
            <div>
              <div>An identical purchase order already exists in the system.</div>
              <div style={{ marginTop: 6 }}>
                You can download the PDF of the existing record or close this message to review your inputs.
              </div>
            </div>
          ),
          primaryText: "Download PDF",
          secondaryText: "Close",
          onPrimary: () => {
            setModal(null);
            exportToPDF();
          },
          onClose: () => setModal(null),
        });
        return;
      }

      const payload = buildPurchaseOrderPayload(formData);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/api/purchaseorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to submit order`);
      }
      
      const responseData = await response.json();
      const receivedUniqueId = responseData.unique_id || responseData.data?.unique_id || "";

      try {
        await updateGoogleSheet(receivedUniqueId);
      } catch (sheetError) {
        console.warn("[PO][UI] Google Sheet update failed:", sheetError);
      }

      setSubmitStatus("success");
    } catch (error) {
      console.error("[PO][UI] Error submitting order:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="po-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => router.back()}
            className="btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <h1 className="po-title">Purchase Order</h1>
        </div>
        <div className="po-logo" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img
            src="/images/logo.png"
            alt="MAA TARINI ENTERPRISES"
            style={{ height: "50px", width: "auto" }}
          />
          <div className="logo-text-group">
            <div className="logo-brand">MAA TARINI ENTERPRISES</div>
            <div className="logo-subtitle">Purchase Order Management</div>
          </div>
        </div>
      </div>

      <div className="details-grid">
        <div className="detail-card">
          <h2 className="card-title">Buyer Details</h2>
          <div className="form-group">
            <label className="form-label">Buyer/Company Name</label>
            <input
              value={formData.company.name}
              onChange={updateNestedField("company", "name")}
              className="form-input"
              placeholder="Enter company name"
            />
            {validationErrors.companyName && <div className="error-message">{validationErrors.companyName}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Company Address</label>
            <input
              placeholder="Enter company address"
              value={formData.company.address}
              onChange={updateNestedField("company", "address")}
              className="form-input"
            />
            {validationErrors.companyAddress && <div className="error-message">{validationErrors.companyAddress}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Pincode</label>
            <input
              placeholder="Enter pincode"
              value={formData.company.cityStateZip}
              onChange={updateNumericField("company", "cityStateZip")}
              className="form-input"
            />
            {validationErrors.companyCityStateZip && (
              <div className="error-message">{validationErrors.companyCityStateZip}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Country</label>
            <input
              placeholder="Enter country"
              value={formData.company.country}
              onChange={updateNestedField("company", "country")}
              className="form-input"
            />
            {validationErrors.companyCountry && <div className="error-message">{validationErrors.companyCountry}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Order Date</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                value={formData.orderInfo.orderDate}
                onChange={updateNestedField("orderInfo", "orderDate")}
                className="form-input"
              />
              <Calendar className="date-icon" size={20} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contact Person</label>
            <input
              placeholder="Enter contact person name"
              value={formData.company.contact || ""}
              onChange={updateNestedField("company", "contact")}
              className="form-input"
            />
            {validationErrors.companyContact && <div className="error-message">{validationErrors.companyContact}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">PO Number</label>
            <input
              placeholder="Enter PO number"
              value={formData.orderInfo.poNumber}
              onChange={updateNumericField("orderInfo", "poNumber")}
              className="form-input"
            />
            {validationErrors.poNumber && <div className="error-message">{validationErrors.poNumber}</div>}
          </div>
        </div>

        <div className="detail-card">
          <h2 className="card-title">Vendor Details</h2>
          <div className="form-group">
            <label className="form-label">Vendor Name</label>
            <input
              placeholder="Enter vendor name"
              value={formData.vendor.name}
              onChange={updateNestedField("vendor", "name")}
              className="form-input"
            />
            {validationErrors.vendorName && <div className="error-message">{validationErrors.vendorName}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Vendor Address</label>
            <input
              placeholder="Enter vendor address"
              value={formData.vendor.address}
              onChange={updateNestedField("vendor", "address")}
              className="form-input"
            />
            {validationErrors.vendorAddress && <div className="error-message">{validationErrors.vendorAddress}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Pincode</label>
            <input
              placeholder="Enter pincode"
              value={formData.vendor.cityStateZip}
              onChange={updateNumericField("vendor", "cityStateZip")}
              className="form-input"
            />
            {validationErrors.vendorCityStateZip && (
              <div className="error-message">{validationErrors.vendorCityStateZip}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Country</label>
            <input
              placeholder="Enter country"
              value={formData.vendor.country}
              onChange={updateNestedField("vendor", "country")}
              className="form-input"
            />
            {validationErrors.vendorCountry && <div className="error-message">{validationErrors.vendorCountry}</div>}
          </div>

          <div className="order-info-section">
            <h3 className="section-subtitle">Order Information</h3>
            <div className="form-group">
              <label className="form-label">PO Number</label>
              <input
                placeholder="Enter PO number"
                value={formData.orderInfo.poNumber}
                onChange={updateNumericField("orderInfo", "poNumber")}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Delivery Date</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  value={formData.orderInfo.deliveryDate}
                  onChange={updateNestedField("orderInfo", "deliveryDate")}
                  className="form-input"
                />
                <Calendar className="date-icon" size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="line-items-card">
        <h2 className="card-title">Line Items</h2>
        <div className="table-wrapper">
          <table className="line-items-table">
            <thead>
              <tr>
                <th className="col-description">Item Description</th>
                <th className="col-quantity">Quantity</th>
                <th className="col-rate">Rate</th>
                <th className="col-gst">GST (%)</th>
                <th className="col-amount">Amount</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {formData.lineItems.map((item, index) => (
                <tr key={item.id}>
                  <td className="col-description">
                    <input
                      placeholder="Enter item description"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                      className="table-input"
                    />
                    {validationErrors[`lineItemDescription_${index}`] && (
                      <div className="error-message">{validationErrors[`lineItemDescription_${index}`]}</div>
                    )}
                  </td>
                  <td className="col-quantity">
                    <input
                      type="text"
                      placeholder="0"
                      value={
                        quantityDisplayValues[item.id] !== undefined
                          ? quantityDisplayValues[item.id]
                          : item.quantity === 0
                          ? ""
                          : item.quantity.toString()
                      }
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        if (inputValue === "") {
                          setQuantityDisplayValues({ ...quantityDisplayValues, [item.id]: "" });
                          updateLineItem(item.id, "quantity", 0);
                        } else if (/^\d+$/.test(inputValue)) {
                          setQuantityDisplayValues({ ...quantityDisplayValues, [item.id]: inputValue });
                          const parsed = Number.parseInt(inputValue, 10);
                          if (!Number.isNaN(parsed)) {
                            updateLineItem(item.id, "quantity", parsed);
                          }
                        }
                      }}
                      onBlur={() => {
                        const newDisplayValues = { ...quantityDisplayValues };
                        delete newDisplayValues[item.id];
                        setQuantityDisplayValues(newDisplayValues);
                      }}
                      className="table-input"
                    />
                    {validationErrors[`lineItemQuantity_${index}`] && (
                      <div className="error-message">{validationErrors[`lineItemQuantity_${index}`]}</div>
                    )}
                  </td>
                  <td className="col-rate">
                    <input
                      type="text"
                      placeholder="0.00"
                      value={
                        rateDisplayValues[item.id] !== undefined
                          ? rateDisplayValues[item.id]
                          : item.rate === 0
                          ? ""
                          : item.rate.toString()
                      }
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        if (inputValue === "") {
                          setRateDisplayValues({ ...rateDisplayValues, [item.id]: "" });
                          updateLineItem(item.id, "rate", 0);
                        } else if (/^\d*\.?\d*$/.test(inputValue)) {
                          setRateDisplayValues({ ...rateDisplayValues, [item.id]: inputValue });
                          const parsed = Number.parseFloat(inputValue);
                          if (!Number.isNaN(parsed)) {
                            updateLineItem(item.id, "rate", parsed);
                          } else if (inputValue === ".") {
                            updateLineItem(item.id, "rate", 0);
                          }
                        }
                      }}
                      onBlur={() => {
                        const newDisplayValues = { ...rateDisplayValues };
                        delete newDisplayValues[item.id];
                        setRateDisplayValues(newDisplayValues);
                      }}
                      className="table-input"
                    />
                    {validationErrors[`lineItemRate_${index}`] && (
                      <div className="error-message">{validationErrors[`lineItemRate_${index}`]}</div>
                    )}
                  </td>
                  <td className="col-gst">
                    <input
                      type="text"
                      placeholder="0"
                      value={
                        gstDisplayValues[item.id] !== undefined
                          ? gstDisplayValues[item.id]
                          : item.gst === 0
                          ? ""
                          : item.gst.toString()
                      }
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        if (inputValue === "") {
                          setGstDisplayValues({ ...gstDisplayValues, [item.id]: "" });
                          updateLineItem(item.id, "gst", 0);
                        } else if (/^\d+$/.test(inputValue)) {
                          setGstDisplayValues({ ...gstDisplayValues, [item.id]: inputValue });
                          const parsed = Number.parseInt(inputValue, 10);
                          if (!Number.isNaN(parsed)) {
                            updateLineItem(item.id, "gst", parsed);
                          }
                        }
                      }}
                      onBlur={() => {
                        const newDisplayValues = { ...gstDisplayValues };
                        delete newDisplayValues[item.id];
                        setGstDisplayValues(newDisplayValues);
                      }}
                      className="table-input"
                    />
                    {validationErrors[`lineItemGst_${index}`] && (
                      <div className="error-message">{validationErrors[`lineItemGst_${index}`]}</div>
                    )}
                  </td>
                  <td className="col-amount">₹ {item.amount.toFixed(2)}</td>
                  <td className="col-actions">
                    <button onClick={() => removeLineItem(item.id)} className="delete-btn">
                      <X size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="button" onClick={addLineItem} className="add-line-item-btn">
          <Plus size={18} />
          Add Line Item
        </button>
      </div>

      <div className="footer-section">
        <div className="totals-group">
          <div className="total-row total-final">
            <span className="total-label">Total: ₹ {formData.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={exportToPDF} className="btn-secondary">
            Export to PDF
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Submitting..." : "Submit Order"}
          </button>
        </div>
      </div>

      {modal && (
        <div
          className="po-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            className="po-modal-card"
            style={{
              width: 420,
              maxWidth: "92%",
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "14px 16px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{modal.title}</div>
            </div>
            <div style={{ padding: 16, fontSize: 14, lineHeight: 1.5 }}>{modal.description}</div>
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: 12, borderTop: "1px solid #e2e8f0" }}
            >
              {modal.secondaryText && (
                <button
                  type="button"
                  onClick={modal.onClose}
                  className="px-3 py-1.5"
                  style={{ border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff" }}
                >
                  {modal.secondaryText}
                </button>
              )}
              {modal.primaryText && (
                <button
                  type="button"
                  onClick={modal.onPrimary}
                  className="px-3 py-1.5"
                  style={{ borderRadius: 6, background: "#2563eb", color: "#fff", border: 0 }}
                >
                  {modal.primaryText}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {submitStatus === "success" && <div className="status success">Purchase order submitted successfully!</div>}
      {submitStatus === "error" && <div className="status error">Failed to submit purchase order. Please try again.</div>}
    </div>
  );
}
