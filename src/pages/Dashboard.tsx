import { useState, useEffect, FormEvent } from "react";
import { Loader2, FileText, MapPin, QrCode, Users, LayoutGrid } from "lucide-react";
import { collection, getDocs, getDoc, setDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { generateBagQrLabelPdf } from "../utils/pdf";
import { dismissKeyboard } from "../utils/keyboard";
import { getDeliveryDayDescription, getMetricsForRange } from "../utils/dashboardMetrics";
import { QrBagModal } from "../components/dashboard/QrBagModal";
import { DashboardGeneralTab } from "../components/dashboard/DashboardGeneralTab";
import { DashboardOrdersTab } from "../components/dashboard/DashboardOrdersTab";
import { DashboardLocationsTab } from "../components/dashboard/DashboardLocationsTab";
import { DashboardQrCodesTab } from "../components/dashboard/DashboardQrCodesTab";
import { DashboardCustomersTab } from "../components/dashboard/DashboardCustomersTab";

const sortByCreatedDesc = (a: any, b: any) =>
  (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
  (a.createdAt ? new Date(a.createdAt).getTime() : 0);

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    "general" | "orders" | "locations" | "qrcodes" | "customers"
  >("general");
  const [orders, setOrders] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [bags, setBags] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorObj, setErrorObj] = useState<string | null>(null);

  // Analytics & Tooltip state
  const [timeRange, setTimeRange] = useState<"7d" | "4w" | "6m" | "all">("7d");
  const [activeMetricTooltip, setActiveMetricTooltip] = useState<string | null>(null);

  // Orders Filter State
  const [orderFilter, setOrderFilter] = useState<"all" | "pending" | "processing" | "completed">("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Customers Management State
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingCustOrders, setLoadingCustOrders] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Location Modal State
  const [showLocModal, setShowLocModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState<any>(null);
  const [savingLoc, setSavingLoc] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  // QR creation state
  const [creatingBag, setCreatingBag] = useState(false);
  const [selectedQRBag, setSelectedQRBag] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorObj(null);
    try {
      const [ordersSnap, locationsSnap, bagsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, "orders")),
        getDocs(collection(db, "locations")),
        getDocs(collection(db, "bags")),
        getDocs(collection(db, "users")),
      ]);

      const usersList: any[] = [];
      const usersMap: Record<string, any> = {};
      usersSnap.forEach((snap) => {
        const u = snap.data();
        usersList.push(u);
        usersMap[u.id] = u;
      });
      usersList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      const rawOrdersList: any[] = [];
      ordersSnap.forEach((snap) => rawOrdersList.push(snap.data()));
      rawOrdersList.sort(sortByCreatedDesc);

      const ordersData = rawOrdersList.map((ord) => {
        const u = ord.userId ? usersMap[ord.userId] : null;
        return {
          id: ord.id,
          userId: ord.userId,
          bagId: ord.bagId,
          status: ord.status,
          createdAt: ord.createdAt,
          deliveryType: ord.deliveryType,
          financialCalc: ord.financialCalc,
          user: u,
          userName: u ? u.name || "" : "Usuario no encontrado",
          userPhone: u ? u.phone || "" : "",
          addressCalle: u ? u.addressCalle || "" : "",
          addressColonia: u ? u.addressColonia || "" : "",
          preferredTime: u ? u.preferredTime || "" : "",
        };
      });

      const locationsData: any[] = [];
      locationsSnap.forEach((snap) => {
        const data = snap.data();
        if (data.isActive === 1 || data.isActive === true) {
          locationsData.push(data);
        }
      });
      if (locationsData.length === 0) {
        locationsData.push({
          id: "loc_1",
          name: "Ubicación Palmas",
          address: "Paseo de las Palmas 209, Coatzacoalcos, Veracruz",
          isActive: 1,
          latitude: 18.1404,
          longitude: -94.4632,
        });
      }

      const rawBagsList: any[] = [];
      bagsSnap.forEach((snap) => rawBagsList.push(snap.data()));
      rawBagsList.sort((a, b) => (a.id || "").localeCompare(b.id || ""));

      const bagsData = rawBagsList.map((bag) => {
        const u = bag.userId ? usersMap[bag.userId] : null;
        let assignedAt = bag.assignedAt || null;

        if (!assignedAt && bag.status === "assigned") {
          const bagOrders = rawOrdersList.filter((o) => o.bagId === bag.id && o.createdAt);
          if (bagOrders.length > 0) {
            const firstOrderDate = new Date(
              Math.min(...bagOrders.map((o) => new Date(o.createdAt).getTime()))
            );
            assignedAt = firstOrderDate.toISOString();
          }
        }

        return {
          id: bag.id,
          status: bag.status,
          userId: bag.userId,
          userName: u ? u.name || "" : "",
          assignedAt,
        };
      });

      const customersData = usersList
        .filter((u) => u.role !== "admin" && u.id !== "admin")
        .map((u) => {
          let orderCount = 0;
          rawOrdersList.forEach((ord) => {
            if (ord.userId === u.id) {
              orderCount++;
            }
          });
          return { ...u, orderCount };
        });

      setOrders(ordersData);
      setLocations(locationsData);
      setBags(bagsData);
      setCustomers(customersData);
    } catch (err: any) {
      console.error("Direct Firestore fetching failed on dashboard:", err);
      setErrorObj(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      const orderObj = orders.find((o) => o.id === orderId);
      await fetchData();

      if (newStatus === "completed" && orderObj) {
        const suggestedDay = getDeliveryDayDescription();
        const timeInput = orderObj.preferredTime || "17:00 - 19:00";
        const dCalle = orderObj.addressCalle || "";
        const dColonia = orderObj.addressColonia || "";
        const locationPart = dCalle
          ? `${dCalle}${dColonia ? `, Col. ${dColonia}` : ""}`
          : "Mostrador / Recoger presencial";

        const message = `¡Hola, *${orderObj.userName}*! 🧺\n\nTe comunicamos de *SOMOS lavandería* que tu ropa del *Cesto ${orderObj.bagId}* (Orden *#${String(orderObj.id || "").padStart(4, "0")}*) ya está lista, limpia y doblada. ✅\n\n🚚 *Programación de Entrega:*\n📅 *Día:* ${suggestedDay}\n⏰ *Horario:* ${timeInput}\n📍 *Domicilio:* ${locationPart}\n\n¡Muchas gracias por tu confianza! Si tienes alguna duda o necesitas cambiar el horario, avísanos con un mensaje aquí.`;

        let cleanPhone = (orderObj.userPhone || "").replace(/\D/g, "");
        if (cleanPhone.length === 10) cleanPhone = "52" + cleanPhone;
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCreateBag = async () => {
    setCreatingBag(true);
    try {
      const bagsSnap = await getDocs(collection(db, "bags"));
      let nextNum = bagsSnap.size + 1;
      let bagId = `CESTO-${nextNum.toString().padStart(3, "0")}`;

      while ((await getDoc(doc(db, "bags", bagId))).exists()) {
        nextNum++;
        bagId = `CESTO-${nextNum.toString().padStart(3, "0")}`;
      }

      await setDoc(doc(db, "bags", bagId), { id: bagId, status: "unassigned", userId: null });
      await fetchData();
    } catch (err) {
      console.error("Failed to create bag client-side in Firestore:", err);
    } finally {
      setCreatingBag(false);
    }
  };

  const handleSaveLocation = async (e: FormEvent) => {
    e.preventDefault();
    dismissKeyboard();
    setSavingLoc(true);
    try {
      const { id, name, address, isActive } = editingLoc;
      if (id) {
        await updateDoc(doc(db, "locations", id), {
          name,
          address: address || null,
          isActive: isActive ? 1 : 0,
        });
      } else {
        const newId = "loc_" + Date.now();
        await setDoc(doc(db, "locations", newId), {
          id: newId,
          name,
          address: address || null,
          isActive: isActive !== false ? 1 : 0,
        });
      }
      setShowLocModal(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to save location client-side in Firestore:", err);
    } finally {
      setSavingLoc(false);
    }
  };

  const handleExportBagLabelPdf = (bagId: string) => {
    const canvas = document.getElementById("qr-canvas-hidden") as HTMLCanvasElement;
    if (canvas) {
      generateBagQrLabelPdf(bagId, canvas.toDataURL("image/png"));
    }
  };

  const handleSelectCustomer = async (cust: any) => {
    setSelectedCustomer(cust);
    setLoadingCustOrders(true);
    try {
      const ordersSnap = await getDocs(collection(db, "orders"));
      const customerOrdersList: any[] = [];
      ordersSnap.forEach((oSnap) => {
        const o = oSnap.data();
        if (o.userId === cust.id) customerOrdersList.push(o);
      });

      customerOrdersList.sort(sortByCreatedDesc);

      setCustomerOrders(customerOrdersList);
    } catch (err) {
      console.error("Failed to fetch customer orders client-side in Firestore:", err);
    } finally {
      setLoadingCustOrders(false);
    }
  };

  const handleSaveCustomerDetails = async (custDetails: any) => {
    dismissKeyboard();
    setSavingCustomer(true);
    try {
      const {
        id,
        name,
        phone,
        deliveryPreference,
        addressColonia,
        addressCalle,
        addressNumero,
        preferredTime,
        addressReferences,
        credits,
      } = custDetails;
      await updateDoc(doc(db, "users", id), {
        name,
        phone,
        deliveryPreference: deliveryPreference || "24 horas",
        addressColonia: addressColonia || null,
        addressCalle: addressCalle || null,
        addressNumero: addressNumero || null,
        preferredTime: preferredTime || "",
        addressReferences: addressReferences || "",
        credits: credits !== undefined ? Number(credits) : 0,
      });
      await fetchData();
      setSelectedCustomer(custDetails);
      setEditingCustomer(null);
    } catch (err) {
      console.error("Failed to save customer details client-side in Firestore:", err);
    } finally {
      setSavingCustomer(false);
    }
  };

  const metrics = getMetricsForRange(orders, customers, timeRange);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-0 pb-4">
      {errorObj && (
        <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm">
          {errorObj}. Mostrando caché.
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Administración</h1>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("general")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "general"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            General
          </button>
          <button
            onClick={() => {
              setActiveTab("orders");
              setSelectedOrder(null);
            }}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "orders"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FileText className="w-4 h-4" />
            Órdenes
          </button>
          <button
            onClick={() => {
              setActiveTab("customers");
              setSelectedCustomer(null);
            }}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "customers"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Users className="w-4 h-4" />
            Clientes
          </button>
          <button
            onClick={() => setActiveTab("locations")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "locations"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Puntos de Recolección
          </button>
          <button
            onClick={() => setActiveTab("qrcodes")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "qrcodes"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <QrCode className="w-4 h-4" />
            Gestión de Cestos
          </button>
        </nav>
      </div>

      <div className="min-h-[420px] flex flex-col justify-start">
        {activeTab === "general" && (
          <DashboardGeneralTab
            metrics={metrics}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            activeMetricTooltip={activeMetricTooltip}
            setActiveMetricTooltip={setActiveMetricTooltip}
          />
        )}

        {activeTab === "orders" && (
          <DashboardOrdersTab
            orders={orders}
            orderFilter={orderFilter}
            setOrderFilter={setOrderFilter}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            updatingOrderId={updatingOrderId}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {activeTab === "locations" && (
          <DashboardLocationsTab
            locations={locations}
            orders={orders}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            showLocModal={showLocModal}
            setShowLocModal={setShowLocModal}
            editingLoc={editingLoc}
            setEditingLoc={setEditingLoc}
            savingLoc={savingLoc}
            onSaveLocation={handleSaveLocation}
            updatingOrderId={updatingOrderId}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {activeTab === "qrcodes" && (
          <DashboardQrCodesTab
            bags={bags}
            creatingBag={creatingBag}
            onCreateBag={handleCreateBag}
            onSelectQRBag={setSelectedQRBag}
          />
        )}

        {activeTab === "customers" && (
          <DashboardCustomersTab
            customers={customers}
            selectedCustomer={selectedCustomer}
            customerOrders={customerOrders}
            loadingCustOrders={loadingCustOrders}
            editingCustomer={editingCustomer}
            setEditingCustomer={setEditingCustomer}
            savingCustomer={savingCustomer}
            onSelectCustomer={handleSelectCustomer}
            onBackFromCustomer={() => setSelectedCustomer(null)}
            onOpenOrderBreakdown={(o) => {
              setActiveTab("orders");
              setSelectedOrder(o);
            }}
            onSaveCustomerDetails={handleSaveCustomerDetails}
          />
        )}
      </div>

      {selectedQRBag && (
        <QrBagModal
          selectedQRBag={selectedQRBag}
          onClose={() => setSelectedQRBag(null)}
          onExportPdf={handleExportBagLabelPdf}
        />
      )}
    </div>
  );
}
