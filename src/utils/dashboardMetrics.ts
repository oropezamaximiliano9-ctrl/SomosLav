export const getDeliveryDayDescription = () => {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 1);

  const daysOfWeek = [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
  ];
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];

  const dayName = daysOfWeek[deliveryDate.getDay()];
  const dayNum = deliveryDate.getDate();
  const monthName = months[deliveryDate.getMonth()];

  return `${dayName}, ${dayNum} de ${monthName}`;
};

export const CYCLE_OPTIONS = [
  { value: "15", label: "15 min (Medio Ciclo)" },
  { value: "30", label: "30 min (1 Ciclo)" },
  { value: "45", label: "45 min (1.5 Ciclos)" },
  { value: "60", label: "60 min (2 Ciclos)" },
  { value: "75", label: "75 min (2.5 Ciclos)" },
  { value: "90", label: "90 min (3 Ciclos)" },
  { value: "120", label: "120 min (4 Ciclos)" },
] as const;

export const formatBagId = (id: string) => {
  if (!id) return "";
  return id.replace(/^(bolsa|cesto)/i, "Cesto");
};

export const getMetricsForRange = (
  ordersList: any[],
  customersList: any[],
  range: "7d" | "4w" | "6m" | "all"
) => {
  const now = new Date();

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date(2026, 0, 1);
    const safeStr = dateStr.includes(" ") ? dateStr.replace(" ", "T") : dateStr;
    return new Date(safeStr);
  };

  let periodLengthMs = 30 * 24 * 60 * 60 * 1000;
  if (range === "7d") periodLengthMs = 7 * 24 * 60 * 60 * 1000;
  else if (range === "4w") periodLengthMs = 28 * 24 * 60 * 60 * 1000;
  else if (range === "6m") periodLengthMs = 180 * 24 * 60 * 60 * 1000;

  const currentPeriodStart = new Date(now.getTime() - periodLengthMs);
  const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodLengthMs);

  const getTrend = (curr: number, prev: number) => {
    const diff = curr - prev;
    let percent = 0;
    if (prev > 0) percent = Math.round((diff / prev) * 100);
    else if (curr > 0) percent = 100;
    return { percent, isPositive: diff >= 0 };
  };

  const ordersInRange =
    range === "all"
      ? ordersList
      : ordersList.filter((o) => parseDate(o.createdAt) >= currentPeriodStart);

  const previousOrdersInRange =
    range === "all"
      ? []
      : ordersList.filter((o) => {
          const d = parseDate(o.createdAt);
          return d >= previousPeriodStart && d < currentPeriodStart;
        });

  const curCompletedOrders = ordersInRange.filter((o) => o.status === "completed");
  const prevCompletedOrders =
    range === "all"
      ? ordersList.filter(
          (o) => parseDate(o.createdAt) < currentPeriodStart && o.status === "completed"
        )
      : previousOrdersInRange.filter((o) => o.status === "completed");

  const curCompleted = curCompletedOrders.length;
  const prevCompleted = prevCompletedOrders.length;

  const curRevenue = curCompleted * 150;
  const prevRevenue = prevCompleted * 150;

  const curCustomersList =
    range === "all"
      ? customersList
      : customersList.filter((c) => parseDate(c.createdAt) >= currentPeriodStart);
  const prevCustomersInRange =
    range === "all"
      ? []
      : customersList.filter((c) => {
          const d = parseDate(c.createdAt);
          return d >= previousPeriodStart && d < currentPeriodStart;
        });

  const curCusts = curCustomersList.length;
  const prevCusts =
    range === "all"
      ? customersList.filter((c) => parseDate(c.createdAt) < currentPeriodStart).length
      : prevCustomersInRange.length;

  const curTotalKilos = curCompletedOrders.reduce(
    (sum, o) => sum + (Number(o.kilos || o.weight) || 0),
    0
  );
  const curKilos =
    curCompleted > 0 ? Math.round((curTotalKilos / curCompleted) * 10) / 10 : 0;

  const prevTotalKilos = prevCompletedOrders.reduce(
    (sum, o) => sum + (Number(o.kilos || o.weight) || 0),
    0
  );
  const prevKilos =
    prevCompleted > 0 ? Math.round((prevTotalKilos / prevCompleted) * 10) / 10 : 0;

  const getCustId = (o: any) => o.userPhone || o.userName;
  let curRecurrent = 0;
  let prevRecurrent = 0;

  if (range === "all") {
    const counts: Record<string, number> = {};
    ordersList.forEach((o) => {
      const cid = getCustId(o);
      if (cid) counts[cid] = (counts[cid] || 0) + 1;
    });
    curRecurrent = Object.values(counts).filter((c) => c >= 2).length;

    const prevCounts: Record<string, number> = {};
    ordersList
      .filter((o) => parseDate(o.createdAt) < currentPeriodStart)
      .forEach((o) => {
        const cid = getCustId(o);
        if (cid) prevCounts[cid] = (prevCounts[cid] || 0) + 1;
      });
    prevRecurrent = Object.values(prevCounts).filter((c) => c >= 2).length;
  } else {
    const currentCustIdsInPeriod = new Set(ordersInRange.map(getCustId));
    curRecurrent = Array.from(currentCustIdsInPeriod).filter((cid) => {
      if (!cid) return false;
      return ordersList.some(
        (o) => getCustId(o) === cid && parseDate(o.createdAt) < currentPeriodStart
      );
    }).length;

    const prevCustIdsInPeriod = new Set(previousOrdersInRange.map(getCustId));
    prevRecurrent = Array.from(prevCustIdsInPeriod).filter((cid) => {
      if (!cid) return false;
      return ordersList.some(
        (o) => getCustId(o) === cid && parseDate(o.createdAt) < previousPeriodStart
      );
    }).length;
  }

  let estandar = 0;
  let express = 0;
  let otros = 0;

  ordersInRange.forEach((o: any) => {
    const type = (o.deliveryType || "Estándar").toLowerCase();
    if (type.includes("express") || type.includes("expr") || type.includes("24")) {
      express++;
    } else if (
      type.includes("est") ||
      type.includes("stand") ||
      type.includes("48")
    ) {
      estandar++;
    } else {
      otros++;
    }
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const completedOrdersLast30Days = ordersList.filter(
    (o) => o.status === "completed" && parseDate(o.createdAt) >= thirtyDaysAgo
  );
  const allCompletedOrders = ordersList.filter((o) => o.status === "completed");

  const user30DaysCompletedCounts: Record<string, number> = {};
  completedOrdersLast30Days.forEach((o) => {
    const cid = o.userId || o.userPhone || o.userName;
    if (cid) user30DaysCompletedCounts[cid] = (user30DaysCompletedCounts[cid] || 0) + 1;
  });

  const userTotalCompletedCounts: Record<string, number> = {};
  allCompletedOrders.forEach((o) => {
    const cid = o.userId || o.userPhone || o.userName;
    if (cid) userTotalCompletedCounts[cid] = (userTotalCompletedCounts[cid] || 0) + 1;
  });

  let habitual = 0;
  let ocasional = 0;
  let enRiesgo = 0;

  customersList.forEach((c) => {
    const cid = c.id || c.phone || c.name;
    const count30 =
      user30DaysCompletedCounts[cid] ||
      user30DaysCompletedCounts[c.phone] ||
      user30DaysCompletedCounts[c.name] ||
      0;
    const countTotal =
      userTotalCompletedCounts[cid] ||
      userTotalCompletedCounts[c.phone] ||
      userTotalCompletedCounts[c.name] ||
      0;

    if (count30 >= 2) habitual++;
    else if (count30 === 1) ocasional++;
    else if (count30 === 0 && countTotal >= 1) enRiesgo++;
  });

  const activeCustIds = new Set(ordersInRange.map(getCustId).filter(Boolean));
  const activeCustomersCount = activeCustIds.size;
  const promedio =
    activeCustomersCount > 0 ? ordersInRange.length / activeCustomersCount : 0;

  return {
    completed: { value: curCompleted, trend: getTrend(curCompleted, prevCompleted) },
    revenue: { value: curRevenue, trend: getTrend(curRevenue, prevRevenue) },
    customers: {
      value: range === "all" ? customersList.length : curCusts,
      trend: getTrend(curCusts, prevCusts),
    },
    kilos: { value: curKilos, trend: getTrend(curKilos, prevKilos) },
    recurrent: { value: curRecurrent, trend: getTrend(curRecurrent, prevRecurrent) },
    servicePreferences: { estandar, express, otros },
    customerFrequency: {
      habitual,
      ocasional,
      enRiesgo,
      promedio,
    },
  };
};
