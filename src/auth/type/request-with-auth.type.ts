import { UserBaseInfo } from './user-base-info.type';

export type RequestWithAuth = Request & {
  headers: {
    authorization?: string;
  };
  user: UserBaseInfo;
};
