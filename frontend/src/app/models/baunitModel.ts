
export class BaunitModel {
  constructor(
    public id:number,
    public creado_por:string,
    public fecha_creacion: Date,
    public codigo_acceso: string,
    public nombre: string,
    public provincia: string,
    public departamento: string,
    public sector_predio: string,
    public municipio: number,
    public vereda: string,
    public numero_predial: string,
    public tipo: string,
    public complemento: string,
    public estado_expediente: string,
    public longitud: number,
    public latitud: number,
    public numero_catastral: string
  ) {}
}

export function createDummyBaunit(): BaunitModel{
  return new BaunitModel(-1,'',new Date('6666-01-01'),'','','','','',-1,'','','','','',-1,-1,'');
}