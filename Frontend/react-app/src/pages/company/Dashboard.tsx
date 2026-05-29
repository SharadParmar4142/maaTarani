import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { companyAPI, purchaseOrderAPI, truckTrackingAPI, type POStatus, type TruckStatus, type OrderTruckSummary } from '../../lib/api';
import { RefreshCw, LogOut, User, Package, CheckCircle2, Clock, Truck, Key, X, ChevronDown, ChevronUp, AlertCircle, Building2 } from 'lucide-react';

type Order = Record<string, any>;

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Approval Pending', ACCEPTED: 'PO Approved', PICKING: 'Order Placed',
  PACKING: 'UnderLoading', SORTING: 'Dispatched', SHIPPING: 'Delivered',
  FINAL_DELIVERY: 'Receiving Received', REJECTED: 'Rejected',
};

const NEXT_STATUS: Partial<Record<POStatus, POStatus>> = {
  ACCEPTED: 'PICKING', PICKING: 'PACKING', PACKING: 'SORTING', SORTING: 'SHIPPING',
};

const NEXT_TRUCK: Partial<Record<TruckStatus, TruckStatus>> = { UNDER_LOADING: 'DISPATCHED', DISPATCHED: 'DELIVERED' };

const TRUCK_LABEL: Record<string, string> = { UNDER_LOADING: 'UnderLoading', DISPATCHED: 'Dispatched', DELIVERED: 'Delivered', RECEIVING: 'Receiving' };

const badgeClass = (s: string) => {
  if (s === 'FINAL_DELIVERY') return 'bg-emerald-100 text-emerald-700';
  if (s === 'REJECTED') return 'bg-red-100 text-red-700';
  if (['ACCEPTED','PICKING','PACKING','SORTING'].includes(s)) return 'bg-blue-100 text-blue-700';
  return 'bg-yellow-100 text-yellow-700';
};

export default function CompanyDashboardPage() {
  const navigate = useNavigate();
  const { user, company, token, isAuthenticated, isLoading, isCompany, logout } = useAuth();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'available'|'claimed'|'completed'>('available');
  const [expandedId, setExpandedId] = useState<string|null>(null);
  const [claimModal, setClaimModal] = useState<Order|null>(null);
  const [claimCode, setClaimCode] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [notification, setNotification] = useState<{msg:string;ok:boolean}|null>(null);
  const [truckSummary, setTruckSummary] = useState<Record<string,OrderTruckSummary>>({});
  const [allocCount, setAllocCount] = useState<Record<string,string>>({});
  const [allocRows, setAllocRows] = useState<Record<string,{truckNumber:string;lineItemId:string}[]>>({});
  const [delivQty, setDelivQty] = useState<Record<string,string>>({});

  const notify = (msg: string, ok = true) => {
    setNotification({ msg, ok });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
    if (!isLoading && isAuthenticated && !isCompany) navigate('/dashboard');
  }, [isLoading, isAuthenticated, isCompany]);

  const load = async () => {
    if (!token || !isCompany) return;
    setLoading(true); setError('');
    try {
      const res = await companyAPI.getDashboard(token);
      const orders = (res.data?.allOrders || []) as Order[];
      setAllOrders(orders);
      const ids = orders.map((o:Order)=>o.id);
      if (ids.length > 0) {
        const s = await truckTrackingAPI.getSummariesForOrders(token, ids);
        setTruckSummary(s.data || {});
      }
    } catch(e:any) { setError(e.message||'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token && isCompany) load(); }, [token, isCompany]);

  const myCompanyId = company?.id;
  const available = allOrders.filter(o => !o.selectedCompanyId && o.status === 'PENDING');
  // Keep PO in My Orders until user sends final receiving (FINAL_DELIVERY)
  const claimed   = allOrders.filter(o => String(o.selectedCompanyId||'') === String(myCompanyId||'') && o.status !== 'FINAL_DELIVERY' && o.status !== 'REJECTED');
  const completed = allOrders.filter(o => String(o.selectedCompanyId||'') === String(myCompanyId||'') && o.status === 'FINAL_DELIVERY');

  const tabOrders = activeTab === 'available' ? available : activeTab === 'claimed' ? claimed : completed;

  const handleClaim = async () => {
    if (!claimModal || !token) return;
    setClaimLoading(true); setClaimError('');
    try {
      await companyAPI.claimPurchaseOrder(token, claimModal.id, claimCode.trim());
      notify('PO claimed! You can now manage this order.');
      setClaimModal(null); setClaimCode('');
      await load();
    } catch(e:any) { setClaimError(e.message||'Invalid code'); }
    finally { setClaimLoading(false); }
  };

  const updateStatus = async (orderId: string, status: POStatus) => {
    if (!token) return;
    try {
      await purchaseOrderAPI.updateStatus(token, orderId, status);
      notify(`Moved to ${STATUS_LABEL[status]}`);
      await load();
    } catch(e:any) { notify(e.message||'Failed', false); }
  };

  const allocateTrucks = async (orderId: string) => {
    if (!token) return;
    const count = Number(allocCount[orderId]||0);
    const rows = allocRows[orderId]||[];
    if (!count || rows.length !== count || rows.some(r=>!r.truckNumber||!r.lineItemId)) {
      notify('Fill all truck details', false); return;
    }
    try {
      const r = await truckTrackingAPI.allocateTrucks(token, orderId, count, rows);
      setTruckSummary(p=>({...p,[orderId]:r.data}));
      setAllocCount(p=>({...p,[orderId]:''})); setAllocRows(p=>({...p,[orderId]:[]}));
      notify(r.message||'Trucks allocated');
    } catch(e:any) { notify(e.message||'Failed', false); }
  };

  const updateTruckStatus = async (orderId: string, truckId: string, status: TruckStatus) => {
    if (!token) return;
    try {
      const r = await truckTrackingAPI.updateTruckStatus(token, orderId, truckId, status);
      setTruckSummary(p=>({...p,[orderId]:r.data}));
      notify(`Truck → ${TRUCK_LABEL[status]}`);
    } catch(e:any) { notify(e.message||'Failed', false); }
  };

  const saveDelivered = async (orderId: string, truckId: string) => {
    if (!token) return;
    const qty = Number(delivQty[truckId] || 0);
    if (!qty || qty <= 0) { notify('Enter valid quantity', false); return; }

    // Validate against remaining quantity for this truck's line item
    const summary = truckSummary[orderId];
    if (summary) {
      const truck = summary.trucks.find(t => t.id === truckId);
      if (truck) {
        const remaining = summary.remainingByItem.find(r => r.lineItemId === truck.materialLineItemId);
        if (remaining) {
          // Add back this truck's own existing delivered qty (remaining already subtracted it)
          const truckCurrentDelivered = truck.deliveredItems.reduce((s, d) => s + Number(d.quantity || 0), 0);
          const maxAllowed = remaining.remainingQuantity + truckCurrentDelivered;
          if (qty > maxAllowed + 0.0001) {
            notify(`Quantity exceeds remaining — max ${maxAllowed.toFixed(3)} MT for ${truck.materialDescription}`, false);
            return;
          }
        }
      }
    }

    try {
      const r = await truckTrackingAPI.setTruckDeliveredItems(token, orderId, truckId, qty);
      setTruckSummary(p => ({...p, [orderId]: r.data}));
      notify('Quantities saved');
    } catch(e:any) { notify(e.message || 'Failed', false); }
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${notification.ok?'bg-emerald-50 text-emerald-800 border border-emerald-200':'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {notification.ok ? <CheckCircle2 className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
          {notification.msg}
        </div>
      )}

      {/* Claim Modal */}
      {claimModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Enter PO Claim Code</h3>
              <button onClick={()=>{setClaimModal(null);setClaimCode('');setClaimError('');}} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500"/>
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
              <p className="text-sm font-semibold text-gray-700">PO #{claimModal.poNumber}</p>
              <p className="text-sm text-gray-500 mt-1">Vendor: {claimModal.vendorName}</p>
              <p className="text-sm font-bold text-gray-800 mt-1">₹{Number(claimModal.total||0).toLocaleString('en-IN')}</p>
            </div>
            <p className="text-sm text-gray-600 mb-3">Enter the unique code shared by the buyer to claim this PO.</p>
            <div className="relative mb-4">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
              <input value={claimCode} onChange={e=>setClaimCode(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-[#c41e3a] outline-none font-mono tracking-widest"
                placeholder="Enter claim code..." autoFocus/>
            </div>
            {claimError && <p className="text-red-600 text-sm mb-3 flex items-center gap-1"><AlertCircle className="w-4 h-4"/>{claimError}</p>}
            <button onClick={handleClaim} disabled={claimLoading||!claimCode.trim()}
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{background:'linear-gradient(135deg,#c41e3a,#a01830)'}}>
              {claimLoading?<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Validating...</>:<><CheckCircle2 className="w-4 h-4"/>Claim PO</>}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/"><img src="/images/logo.png" alt="MAA TARINI" className="h-9 object-contain"/></Link>
            <div className="hidden sm:block w-px h-6 bg-gray-200"/>
            <span className="hidden sm:block text-sm font-bold text-gray-700">Company Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/company/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-700">
              <User className="w-4 h-4"/> <span className="hidden sm:block">{company?.companyName||user?.name}</span>
            </Link>
            <button onClick={()=>{logout();navigate('/login');}} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 text-sm font-semibold transition-colors">
              <LogOut className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Welcome */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6" style={{background:'linear-gradient(135deg,#fff5f5 0%,#fff 100%)'}}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Welcome, {company?.companyName||user?.name}!</h1>
              <p className="text-gray-500 text-sm mt-1">View available POs, enter claim codes, and manage your orders.</p>
            </div>
            <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/> Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {label:'Available POs', count:available.length, color:'text-yellow-600', bg:'bg-yellow-50', icon:Package},
            {label:'Claimed Orders', count:claimed.length, color:'text-blue-600', bg:'bg-blue-50', icon:Truck},
            {label:'Completed', count:completed.length, color:'text-emerald-600', bg:'bg-emerald-50', icon:CheckCircle2},
          ].map(s=>(
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`}/>
              </div>
              <p className={`text-3xl font-black ${s.color}`}>{s.count}</p>
              <p className="text-xs font-semibold text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs + Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
              {[
                {id:'available',label:`Available (${available.length})`},
                {id:'claimed',label:`My Orders (${claimed.length})`},
                {id:'completed',label:`Completed (${completed.length})`},
              ].map(t=>(
                <button key={t.id} onClick={()=>setActiveTab(t.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab===t.id?'bg-white shadow-sm text-gray-900':'text-gray-500 hover:text-gray-700'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin"/><span>Loading orders...</span>
            </div>
          ) : tabOrders.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <Package className="w-12 h-12 mb-3 opacity-30"/>
              <p className="font-semibold">No orders in this category</p>
              {activeTab==='available' && <p className="text-sm mt-1">New POs from buyers will appear here</p>}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tabOrders.map((order:Order)=>{
                const isExpanded = expandedId === order.id;
                const nextStatus = NEXT_STATUS[order.status as POStatus];
                const summary = truckSummary[order.id];
                return (
                  <div key={order.id} className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-base font-bold text-gray-900">PO #{order.poNumber}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeClass(order.status)}`}>{STATUS_LABEL[order.status]||order.status}</span>
                        </div>
                        <p className="text-sm text-gray-600">Vendor: <span className="font-medium text-gray-800">{order.vendorName}</span></p>
                        {order.user && <p className="text-sm text-gray-500">Buyer: {order.user.name}</p>}
                        <p className="text-sm font-bold text-gray-800 mt-1">₹{Number(order.total||0).toLocaleString('en-IN')}</p>
                        {order.orderDate && <p className="text-xs text-gray-400 mt-0.5">Order date: {new Date(order.orderDate).toLocaleDateString()}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {activeTab==='available' && (
                          <button onClick={()=>{setClaimModal(order);setClaimCode('');setClaimError('');}}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                            style={{background:'linear-gradient(135deg,#c41e3a,#a01830)'}}>
                            <Key className="w-4 h-4"/> Enter Code
                          </button>
                        )}
                        {activeTab==='claimed' && nextStatus && (
                          <button onClick={()=>updateStatus(order.id, nextStatus)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all">
                            Move → {STATUS_LABEL[nextStatus]}
                          </button>
                        )}
                        <button onClick={()=>setExpandedId(isExpanded?null:order.id)}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 border-2 border-gray-200 hover:bg-gray-50 transition-all">
                          {isExpanded?<ChevronUp className="w-4 h-4"/>:<ChevronDown className="w-4 h-4"/>}
                          {isExpanded?'Less':'Details'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-5 space-y-4">
                        {/* Line Items */}
                        {order.lineItems && order.lineItems.length > 0 && (
                          <div className="rounded-xl border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Line Items</div>
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>{['Description','Qty','Rate','Amount'].map(h=><th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {order.lineItems.map((item:any)=>(
                                  <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-medium text-gray-800">{item.description}</td>
                                    <td className="px-4 py-2.5 text-gray-600">{item.quantity}</td>
                                    <td className="px-4 py-2.5 text-gray-600">₹{Number(item.rate||0).toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-2.5 font-semibold text-gray-800">₹{Number(item.amount||0).toLocaleString('en-IN')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Remaining Quantity — live tracking per line item */}
                        {truckSummary[order.id] && truckSummary[order.id].remainingByItem.length > 0 && (
                          <div className="rounded-xl border border-blue-100 bg-blue-50 overflow-hidden">
                            <div className="bg-blue-100 px-4 py-2.5 text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
                              <Package className="w-3.5 h-3.5" /> Remaining Quantity
                            </div>
                            <table className="w-full text-sm">
                              <thead>
                                <tr>
                                  {['Item', 'Ordered', 'Delivered', 'Remaining'].map(h => (
                                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-blue-600">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-blue-100 bg-white">
                                {truckSummary[order.id].remainingByItem.map(item => (
                                  <tr key={item.lineItemId}>
                                    <td className="px-4 py-2.5 font-medium text-gray-800">{item.description}</td>
                                    <td className="px-4 py-2.5 text-gray-500">{item.orderedQuantity} MT</td>
                                    <td className="px-4 py-2.5 text-gray-500">{item.deliveredQuantity.toFixed(3)} MT</td>
                                    <td className={`px-4 py-2.5 font-bold ${
                                      item.remainingQuantity === 0 ? 'text-emerald-600' :
                                      item.remainingQuantity < item.orderedQuantity * 0.2 ? 'text-rose-600' :
                                      'text-blue-700'
                                    }`}>
                                      {item.remainingQuantity.toFixed(3)} MT
                                      {item.remainingQuantity === 0 && <span className="ml-1 text-emerald-500">✓</span>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {activeTab==='claimed' && (
                          <div className="rounded-xl border border-gray-100 p-4">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Truck className="w-4 h-4 text-blue-600"/>Truck Management</h4>
                            {(order.status==='PACKING'||order.status==='SORTING'||order.status==='SHIPPING') && (
                              <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-200">
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Number of Trucks</label>
                                <input type="number" min={1} value={allocCount[order.id]||''}
                                  onChange={e=>{
                                    const n=Number(e.target.value||0);
                                    setAllocCount(p=>({...p,[order.id]:e.target.value}));
                                    const prev=allocRows[order.id]||[];
                                    setAllocRows(p=>({...p,[order.id]:Array.from({length:Math.max(n,0)},(_,i)=>prev[i]||{truckNumber:'',lineItemId:''})}));
                                  }}
                                  className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3" placeholder="e.g. 3"/>
                                <div className="space-y-2">
                                  {(allocRows[order.id]||[]).map((row,i)=>(
                                    <div key={i} className="grid grid-cols-2 gap-2">
                                      <input value={row.truckNumber} onChange={e=>setAllocRows(p=>({...p,[order.id]:(p[order.id]||[]).map((r,ri)=>ri===i?{...r,truckNumber:e.target.value.toUpperCase()}:r)}))}
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Truck No (MH02AC1234)"/>
                                      <select value={row.lineItemId} onChange={e=>setAllocRows(p=>({...p,[order.id]:(p[order.id]||[]).map((r,ri)=>ri===i?{...r,lineItemId:e.target.value}:r)}))}
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                                        <option value="">Select material</option>
                                        {(order.lineItems||[]).map((li:any)=><option key={li.id} value={li.id}>{li.description}</option>)}
                                      </select>
                                    </div>
                                  ))}
                                </div>
                                {(allocRows[order.id]||[]).length>0 && (
                                  <button onClick={()=>allocateTrucks(order.id)} className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-all">
                                    Allocate Trucks
                                  </button>
                                )}
                              </div>
                            )}
                            {summary && summary.truckCount > 0 ? (
                              <div className="space-y-2">
                                {summary.trucks.map(truck => {
                                  const next = NEXT_TRUCK[truck.status];
                                  const isReceiving = truck.status === 'RECEIVING';
                                  return (
                                    <div key={truck.id} className={`flex flex-col gap-2 p-3 rounded-xl border ${isReceiving ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}>
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <div>
                                          <p className="text-sm font-bold text-gray-800">{truck.truckNumber}</p>
                                          <p className="text-xs text-gray-500">{TRUCK_LABEL[truck.status]} · {truck.materialDescription}</p>
                                          {truck.userShortageQuantity != null && !isReceiving && (
                                            <p className="text-xs text-rose-600">Shortage: {truck.userShortageQuantity}</p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {next && <button onClick={() => updateTruckStatus(order.id, truck.id, next)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all">→ {TRUCK_LABEL[next]}</button>}
                                          {truck.status === 'DELIVERED' && (() => {
                                            const remainItem = summary?.remainingByItem.find(r => r.lineItemId === truck.materialLineItemId);
                                            const truckExisting = truck.deliveredItems.reduce((s, d) => s + Number(d.quantity || 0), 0);
                                            const maxAllowed = remainItem ? remainItem.remainingQuantity + truckExisting : null;
                                            return (
                                              <div className="flex flex-col items-end gap-0.5">
                                                {maxAllowed !== null && (
                                                  <span className="text-xs text-blue-600 font-semibold">Max: {maxAllowed.toFixed(3)} MT</span>
                                                )}
                                                <div className="flex items-center gap-2">
                                                  <input type="number" step="0.001" min={0}
                                                    max={maxAllowed !== null ? maxAllowed : undefined}
                                                    value={delivQty[truck.id] || ''}
                                                    onChange={e => setDelivQty(p => ({...p, [truck.id]: e.target.value}))}
                                                    className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-xs" placeholder="Qty (MT)"/>
                                                  <button onClick={() => saveDelivered(order.id, truck.id)}
                                                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg">Save Qty</button>
                                                </div>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                      {/* Receiving received from buyer */}
                                      {isReceiving && (
                                        <div className="border-t border-emerald-200 pt-2.5">
                                          <p className="text-xs font-bold text-emerald-700 mb-1.5 flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Receiving Received from Buyer
                                          </p>
                                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                            <span className="text-gray-600">Net Received: <strong className="text-emerald-700">{truck.effectiveReceivedQuantity.toFixed(3)} MT</strong></span>
                                            {(truck.userShortageQuantity || 0) > 0 && (
                                              <span className="text-rose-600">Shortage: <strong>{Number(truck.userShortageQuantity).toFixed(3)} MT</strong></span>
                                            )}
                                            {truck.userReceivingNote && (
                                              <span className="col-span-2 text-gray-500 italic">Note: {truck.userReceivingNote}</span>
                                            )}
                                            {truck.userReceivingUpdatedAt && (
                                              <span className="col-span-2 text-gray-400">Submitted: {new Date(truck.userReceivingUpdatedAt).toLocaleString()}</span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">No trucks allocated yet.</p>
                            )}
                          </div>
                        )}

                        {/* Completed tab — Receiving Reports */}
                        {activeTab === 'completed' && truckSummary[order.id] && truckSummary[order.id].trucks.some(t => t.userReceivingUpdatedAt != null) && (
                          <div className="rounded-xl border border-emerald-100 p-4 bg-emerald-50">
                            <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Receiving Reports from Buyer</h4>
                            <div className="space-y-2">
                              {truckSummary[order.id].trucks.filter(t => t.userReceivingUpdatedAt != null).map(truck => (
                                <div key={truck.id} className="bg-white border border-emerald-200 rounded-xl p-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-bold text-gray-800 text-sm">{truck.truckNumber}</p>
                                      <p className="text-xs text-gray-500">{truck.materialDescription}</p>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Received</span>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                                    <span className="text-gray-600">Net Received: <strong className="text-emerald-700">{truck.effectiveReceivedQuantity.toFixed(3)} MT</strong></span>
                                    {(truck.userShortageQuantity || 0) > 0 && (
                                      <span className="text-rose-600">Shortage: <strong>{Number(truck.userShortageQuantity).toFixed(3)} MT</strong></span>
                                    )}
                                    {truck.userReceivingNote && <span className="text-gray-500 italic col-span-2">Note: {truck.userReceivingNote}</span>}
                                  </div>
                                  {truck.userReceivingUpdatedAt && (
                                    <p className="text-xs text-gray-400 mt-1">Submitted: {new Date(truck.userReceivingUpdatedAt).toLocaleString()}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
