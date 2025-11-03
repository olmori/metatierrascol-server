
/**
 * Model to manage the public.auth_user and the core.app_user tables 
 */
export class DjangoAndAppUserModel {
  constructor(
    public user_id: number,
    public app_user_id: number,
    public username: string,
    public email: string,
    public is_superuser: boolean,
    public is_staff:string,
    public is_active: boolean,
    public date_joined: Date,
    public notification_acceptation: boolean,
    public interest: string,
    public email_confirmed: boolean,
    public user_groups: string[],
    public data_acceptation: boolean,
    public last_login: Date,
  ) {}
}

