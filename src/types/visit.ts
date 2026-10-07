export type VisitStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled';

export type VisitRequest = {
  id: string;
  propertyId: string;
  /** Local date, "YYYY-MM-DD". */
  date: string;
  /** 24-hour start time, "HH:mm". */
  time: string;
  message: string;
  status: VisitStatus;
  /** ISO timestamp. */
  createdAt: string;
};