
export class MobileAppVersionNotesModel {
  constructor(
    public id: number,
    public mobileappversion: number,
    public creado_por: number,
    public fecha: Date,
    public nota: string
  ) {}
}