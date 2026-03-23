const test = require("node:test");
const assert = require("node:assert/strict");

const {
  PO_STATUSES,
  STATUS_TRANSITIONS,
  canTransitionStatus,
  getAllowedNextStatuses,
} = require("../utils/poStatusTransitions");

test("allows exact sequential transitions", () => {
  assert.equal(canTransitionStatus(PO_STATUSES.PENDING, PO_STATUSES.ACCEPTED), true);
  assert.equal(canTransitionStatus(PO_STATUSES.ACCEPTED, PO_STATUSES.PICKING), true);
  assert.equal(canTransitionStatus(PO_STATUSES.PICKING, PO_STATUSES.PACKING), true);
  assert.equal(canTransitionStatus(PO_STATUSES.PACKING, PO_STATUSES.SORTING), true);
  assert.equal(canTransitionStatus(PO_STATUSES.SORTING, PO_STATUSES.SHIPPING), true);
  assert.equal(canTransitionStatus(PO_STATUSES.SHIPPING, PO_STATUSES.FINAL_DELIVERY), true);
});

test("prevents status skipping like ACCEPTED to SHIPPING", () => {
  assert.equal(canTransitionStatus(PO_STATUSES.ACCEPTED, PO_STATUSES.SHIPPING), false);
  assert.equal(canTransitionStatus(PO_STATUSES.PENDING, PO_STATUSES.PACKING), false);
});

test("allows rejecting only from pending", () => {
  assert.equal(canTransitionStatus(PO_STATUSES.PENDING, PO_STATUSES.REJECTED), true);
  assert.equal(canTransitionStatus(PO_STATUSES.ACCEPTED, PO_STATUSES.REJECTED), false);
});

test("terminal statuses do not allow further transitions", () => {
  assert.deepEqual(getAllowedNextStatuses(PO_STATUSES.FINAL_DELIVERY), []);
  assert.deepEqual(getAllowedNextStatuses(PO_STATUSES.REJECTED), []);
  assert.equal(canTransitionStatus(PO_STATUSES.FINAL_DELIVERY, PO_STATUSES.PENDING), false);
  assert.equal(canTransitionStatus(PO_STATUSES.REJECTED, PO_STATUSES.ACCEPTED), false);
});

test("same status transition is treated as idempotent", () => {
  for (const status of Object.values(PO_STATUSES)) {
    assert.equal(canTransitionStatus(status, status), true);
  }
});

test("transition map includes all statuses", () => {
  for (const status of Object.values(PO_STATUSES)) {
    assert.ok(Array.isArray(STATUS_TRANSITIONS[status]));
  }
});
