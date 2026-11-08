export function isHeld(
  request: { status: string; startDate: string },
  today: string,
) {
  return request.status === "approved" && request.startDate <= today;
}

export function isOverdue(
  request: { status: string; endDate: string },
  today: string,
) {
  return request.status === "approved" && request.endDate <= today;
}
