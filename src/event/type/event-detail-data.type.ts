import { ReviewData } from 'src/review/type/review-data.type';

export type EventDetailData = {
  id: number;
  hostId: number;
  title: string;
  description: string;
  categoryId: number;
  eventCity: {
    cityId: number;
  }[];
  startTime: Date;
  endTime: Date;
  maxPeople: number;
  eventJoin: {
    user: {
      id: number;
      name: string;
    };
  }[];
  clubId: number | null;
  isArchiveEvent: boolean;
  review: ReviewData[];
};
