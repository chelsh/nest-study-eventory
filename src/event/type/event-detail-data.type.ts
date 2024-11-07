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
  status: EventStatus;
  joinedUsers: {
    id: number;
    name: string;
  }[];
  reviews: {
    id: number;
    eventId: number;
    userId: number;
    score: number;
    title: string;
    description: string | null;
  }[];
};

export const EventStatus = {
  PENDING: 'PENDING', // 시작 전
  ONGOING: 'ONGOING', // 진행 중
  COMPLETED: 'COMPLETED', // 종료
};

export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];
