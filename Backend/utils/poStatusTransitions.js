const PO_STATUSES = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  PICKING: "PICKING",
  PACKING: "PACKING",
  SORTING: "SORTING",
  SHIPPING: "SHIPPING",
  FINAL_DELIVERY: "FINAL_DELIVERY",
  REJECTED: "REJECTED",
};

const IN_PROGRESS_STATUSES = [
  PO_STATUSES.ACCEPTED,
  PO_STATUSES.PICKING,
  PO_STATUSES.PACKING,
  PO_STATUSES.SORTING,
  PO_STATUSES.SHIPPING,
];

const STATUS_TRANSITIONS = {
  [PO_STATUSES.PENDING]: [PO_STATUSES.ACCEPTED, PO_STATUSES.REJECTED],
  [PO_STATUSES.ACCEPTED]: [PO_STATUSES.PICKING],
  [PO_STATUSES.PICKING]: [PO_STATUSES.PACKING],
  [PO_STATUSES.PACKING]: [PO_STATUSES.SORTING],
  [PO_STATUSES.SORTING]: [PO_STATUSES.SHIPPING],
  [PO_STATUSES.SHIPPING]: [PO_STATUSES.FINAL_DELIVERY],
  [PO_STATUSES.FINAL_DELIVERY]: [],
  [PO_STATUSES.REJECTED]: [],
};

function getAllowedNextStatuses(status) {
  return STATUS_TRANSITIONS[status] || [];
}

function canTransitionStatus(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) {
    return true;
  }

  return getAllowedNextStatuses(currentStatus).includes(nextStatus);
}

module.exports = {
  PO_STATUSES,
  IN_PROGRESS_STATUSES,
  STATUS_TRANSITIONS,
  getAllowedNextStatuses,
  canTransitionStatus,
};