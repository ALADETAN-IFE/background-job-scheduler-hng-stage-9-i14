import { RecurrenceInterval } from "@/types";

const INTERVAL_MAP: Record<RecurrenceInterval, number> = {
  [RecurrenceInterval.EVERY_1_MINUTE]: 60 * 1000,
  [RecurrenceInterval.EVERY_5_MINUTES]: 5 * 60 * 1000,
  [RecurrenceInterval.EVERY_1_HOUR]: 60 * 60 * 1000,
  [RecurrenceInterval.EVERY_1_DAY]: 24 * 60 * 60 * 1000,
};

export function getNextRunAt(interval: RecurrenceInterval): string {
  const ms = INTERVAL_MAP[interval];
  return new Date(Date.now() + ms).toISOString();
}
