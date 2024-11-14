export type UpdateUserData = {
  email?: string;
  password?: string;
  name?: string;
  birthday?: Date | null;
  cityId?: number | null;
  refreshToken?: string | null;
};
