const PO_STATUS_FOR_TRUCK_ALLOCATION = "PACKING";

const TRUCK_STATUSES = {
  UNDER_LOADING: "UNDER_LOADING",
  DISPATCHED: "DISPATCHED",
  DELIVERED: "DELIVERED",
  RECEIVING: "RECEIVING",
};

const TRUCK_STATUS_TRANSITIONS = {
  [TRUCK_STATUSES.UNDER_LOADING]: [TRUCK_STATUSES.DISPATCHED],
  [TRUCK_STATUSES.DISPATCHED]: [TRUCK_STATUSES.DELIVERED],
  [TRUCK_STATUSES.DELIVERED]: [TRUCK_STATUSES.RECEIVING],
  [TRUCK_STATUSES.RECEIVING]: [],
};

const TRUCK_NUMBER_REGEX = /^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/;

function canTransitionTruckStatus(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) {
    return true;
  }

  return (TRUCK_STATUS_TRANSITIONS[currentStatus] || []).includes(nextStatus);
}

function getNextTruckStatus(currentStatus) {
  const next = TRUCK_STATUS_TRANSITIONS[currentStatus] || [];
  return next[0] || null;
}

module.exports = {
  PO_STATUS_FOR_TRUCK_ALLOCATION,
  TRUCK_STATUSES,
  TRUCK_STATUS_TRANSITIONS,
  TRUCK_NUMBER_REGEX,
  canTransitionTruckStatus,
  getNextTruckStatus,
};
