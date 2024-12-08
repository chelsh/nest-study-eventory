export type CreateEventData = {
  hostId: number;
  title: string;
  description: string;
  categoryId: number;
  cityIdList: number[];
  startTime: Date;
  endTime: Date;
  maxPeople: number;
  clubId?: number;
  isArchiveEvent: boolean;
};
