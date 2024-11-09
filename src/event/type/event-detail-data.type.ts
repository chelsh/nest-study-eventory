import { ReviewData } from 'src/review/type/review-data.type';
import { EventStatusData } from '../enum/event-status.enum';

export type EventDetailData = {
  id: number;
  hostId: number;
  title: string;
  description: string;
  categoryId: number;
  cityId: number;
  startTime: Date;
  endTime: Date;
  maxPeople: number;
  status: EventStatusData;
  joinedUsers: JoinedUserData[];
  reviews: ReviewData[];
};

export type JoinedUserData = {
  id: number;
  name: string;
};
