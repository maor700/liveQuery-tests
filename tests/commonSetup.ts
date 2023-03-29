import { liveQuery } from 'dexie';
import { from, switchMap } from 'rxjs';
import { Item, Layer, store } from '../src/store';
import { v4 } from 'uuid';

export const GROUP_PATH_A = 'level_A/';
export const GROUP_PATH_B = 'level_B/';

export const LAYER_A: Layer = {
  id: 'layer_A',
  name: 'Layer A',
  groupPath: GROUP_PATH_A,
};

export const LAYER_B: Layer = {
  id: 'layer_B',
  name: 'Layer B',
  groupPath: GROUP_PATH_B,
};

export const ITEM_A: Item = {
  id: v4(),
  name: 'item_1',
  layerId: 'layer_A',
};

export const ITEM_B: Item = {
  id: v4(),
  name: 'item_2',
  layerId: 'layer_B',
};

export const mockCallbackObj = {
  items_A: (data: any) => {
    // console.log('got next from items_A');
  },
  items_B: (data: any) => {
    // console.log('got next from items_B');
  },
};

export const sleep = (duration = 100) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });

export async function getItemsByGroupPath(groupPath: string): Promise<Item[]> {
  const layersIds = await store.layers.where('groupPath').startsWith(groupPath).primaryKeys();
  return store.items.where('layerId').anyOf(layersIds).toArray();
}

type populateDBOptions = {
  layersA: number;
  layersB: number;
  itemsA: number;
  itemsB: number;
};
const DEFAULT_POPULATE_OPTIONS: populateDBOptions = {
  layersA: 2,
  layersB: 2,
  itemsA: 2,
  itemsB: 2,
};

export function populateDB(options: populateDBOptions = DEFAULT_POPULATE_OPTIONS) {
  const { layersA, layersB, itemsA, itemsB } = options;

  store.layers.bulkPut(createMulti(LAYER_A, layersA), createMulti(LAYER_B, layersB));
  store.items.bulkPut(createMulti(ITEM_A, itemsA), createMulti(ITEM_B, itemsB));
}

function createUniqe(i: number, base: any): any {
  return { ...base, id: `${base.id}${i}${i}${i}` };
}

function createMulti<T>(base: Partial<T>, count: number): any[] {
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(createUniqe(i, base));
  }
  return result;
}

export const createItemsByGroupPath = (groupPath: string) => {
  const lyaersIds$ = from(liveQuery(() => store.layers.where('groupPath').startsWith(groupPath).primaryKeys()));
  return lyaersIds$.pipe(switchMap((ids) => from(liveQuery(() => store.items.where('layerId').anyOf(ids).toArray()))));
};
