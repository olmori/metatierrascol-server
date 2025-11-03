
export class SettingModel {
  constructor(
    public id: number,
    public parameter_name: string,
    public parameter_value: string,
    public help_en: string,
    public help_es: string
  ) {}
}