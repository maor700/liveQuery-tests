import Dexie, { Table } from 'dexie';
import { ITEM_A, ITEM_B, LAYER_A, LAYER_B } from '../tests/commonSetup';

export interface Layer {
  id?: string;
  name: string;
  groupPath: string;
}

export interface Item {
  id?: string;
  name: string;
  layerId: string;
}

export class MyStore extends Dexie {
  layers!: Table<Layer>;
  items!: Table<Item>;

  constructor() {
    super('myDatabase');
    this.version(1).stores({
      layers: '&id, name, groupPath',
      items: '&id, name, layerId',
    });
  }
}

export const store = new MyStore();