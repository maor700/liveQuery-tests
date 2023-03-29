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

export interface ItemWithGroupPath {
  id?: string;
  name: string;
  groupPath: string;
}

export class MyStore extends Dexie {
  layers!: Table<Layer>;
  items!: Table<Item>;
  itemsWithGroupPath!: Table<ItemWithGroupPath>;

  constructor() {
    super('myDatabase');
    this.version(2).stores({
      layers: '&id, name, groupPath',
      items: '&id, name, layerId',
      itemsWithGroupPath: '&id, name, groupPath',
    });
  }
}

export const store = new MyStore();
