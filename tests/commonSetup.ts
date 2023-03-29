import { liveQuery } from 'dexie';
import { from, switchMap } from 'rxjs';
import { Item, Layer, store } from '../src/store';
import { v4 } from 'uuid';

export const GROUP_PATH_A = 'level_A/';
export const GROUP_PATH_B = 'level_B/';
const LAYER_A_ID = 'layer_A';
const LAYER_B_ID = 'layer_B';

export const LAYER_A: Layer = {
  id: LAYER_A_ID,
  name: 'Layer A',
  groupPath: GROUP_PATH_A,
};

export const LAYER_B: Layer = {
  id: LAYER_B_ID,
  name: 'Layer B',
  groupPath: GROUP_PATH_B,
};

export const ITEM_A: Item = {
  id: v4(),
  name: 'item_1',
  layerId: LAYER_A_ID,
};

export const ITEM_B: Item = {
  id: v4(),
  name: 'item_2',
  layerId: LAYER_B_ID,
};

export const mockCallbackObj = {
  items_A: (data: any) => {
    // console.log('got next from items_A');
  },
  items_B: (data: any) => {
    // console.log('got next from items_B');
  },
};

export const sleep = (duration = 200) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });

export async function getItemsByGroupPath(groupPath: string): Promise<Item[]> {
  const layersIds = await store.layers.where('groupPath').startsWith(groupPath).primaryKeys();
  return store.items.where('layerId').anyOf(layersIds).toArray();
}

export const createItemsByGroupPath = (groupPath: string) => {
  const lyaersIds$ = from(liveQuery(() => store.layers.where('groupPath').startsWith(groupPath).primaryKeys()));
  return lyaersIds$.pipe(switchMap((ids) => from(liveQuery(() => store.items.where('layerId').anyOf(ids).toArray()))));
};
