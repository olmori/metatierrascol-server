export interface LoginResponse {
  expiry: string;
  token: string;
  username: string;
  groups: string[];
  opened_sessions: number;
}
