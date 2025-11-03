import { Injectable, signal } from '@angular/core';
import { AreaDataModel } from '../models/areaDataModel';

@Injectable({ providedIn: 'root' })
export class AreaDataService {
  private _userDataList = signal<AreaDataModel[]>([]);
  userDataList = this._userDataList;

  addUserData(data: AreaDataModel) {
    this._userDataList.update(list => [...list, data]);
  }

  updateUserData(data: AreaDataModel) {
    this._userDataList.update(list =>
      list.map(d => d.id === data.id ? data : d)
    );
  }

  deleteUserData(id: number) {
    this._userDataList.update(list => list.filter(d => d.id !== id));
  }
}
