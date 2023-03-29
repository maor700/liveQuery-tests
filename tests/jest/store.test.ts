import { liveQuery, Subscription } from 'dexie';
import 'fake-indexeddb/auto';
import { v4 } from 'uuid';
import { ItemWithGroupPath, store } from '../../src/store';
import {
  mockCallbackObj,
  getItemsByGroupPath,
  GROUP_PATH_A,
  GROUP_PATH_B,
  sleep,
  ITEM_A,
  LAYER_A,
  LAYER_B,
  ITEM_B,
} from '../commonSetup';

describe('liveQuery reactivity tests', () => {
  const subscriptions: Subscription[] = [];
  let items_A_SpyOn: any;
  let items_B_SpyOn: any;

  beforeEach(async () => {
    items_A_SpyOn = jest.spyOn(mockCallbackObj, 'items_A');
    items_B_SpyOn = jest.spyOn(mockCallbackObj, 'items_B');
  });

  afterEach(async () => {
    subscriptions.forEach((sub) => sub?.unsubscribe?.());
    await store.items.clear();
    await store.layers.clear();
    jest.clearAllMocks();
    items_A_SpyOn = null;
    items_B_SpyOn = null;
  });

  describe('LiveQuery with anyOf(ids[]) in case of --- 2 --- layers in the table', () => {
    it('Adding an item will trigger only the relevants', async () => {
      await store.layers.bulkAdd([LAYER_A, LAYER_B]);
      subscriptions.push(
        liveQuery(() => {
          return getItemsByGroupPath(GROUP_PATH_A);
        }).subscribe(mockCallbackObj.items_A),
        liveQuery(() => {
          return getItemsByGroupPath(GROUP_PATH_B);
        }).subscribe(mockCallbackObj.items_B),
      );
      await sleep();
      await store.items.put(ITEM_A);
      await sleep();
      await store.items.put({ ...ITEM_A, id: '1234' });
      await sleep();
      expect(items_A_SpyOn).toBeCalledTimes(3); // one for first time subscription and the others because db mutations;
      expect(items_B_SpyOn).toBeCalledTimes(1); // one for first time subscription
    });
  });

  describe('LiveQuery with anyOf variable of --- 4 --- layers in the table', () => {
    it('Adding item will trigger only the layer associated with it by layerId', async () => {
      store.layers.bulkAdd([LAYER_A, { ...LAYER_A, id: v4() }, LAYER_B, { ...LAYER_B, id: v4() }]);
      subscriptions.push(
        liveQuery(() => {
          return getItemsByGroupPath(GROUP_PATH_A);
        }).subscribe(mockCallbackObj.items_A),
        liveQuery(() => {
          return getItemsByGroupPath(GROUP_PATH_B);
        }).subscribe(mockCallbackObj.items_B),
      );
      await sleep();
      await store.items.put(ITEM_A);
      await sleep();
      await store.items.put({ ...ITEM_A, id: '1234' });
      await sleep();
      expect(items_A_SpyOn).toBeCalledTimes(3); // one for first time subscription and the others because db mutations;
      expect(items_B_SpyOn).toBeCalledTimes(1); // one for first time subscription
    });
  });
  describe('LiveQuery with groupPath directlly on the item, more!! than 3 Layers in the table', () => {
    const ITEM_A_WITH_GROUP_PATH: ItemWithGroupPath = { id: v4(), groupPath: GROUP_PATH_A, name: 'GP Item A' };
    const ITEM_B_WITH_GROUP_PATH: ItemWithGroupPath = { id: v4(), groupPath: GROUP_PATH_B, name: 'GP Item B' };
    it('Adding item will trigger only the layer associated with it by layerId', async () => {
      store.itemsWithGroupPath.bulkAdd([
        ITEM_A_WITH_GROUP_PATH,
        { ...ITEM_A_WITH_GROUP_PATH, id: v4() },
        ITEM_B_WITH_GROUP_PATH,
        { ...ITEM_B_WITH_GROUP_PATH, id: v4() },
      ]);
      subscriptions.push(
        liveQuery(() => {
          return store.itemsWithGroupPath.where('groupPath').startsWith(GROUP_PATH_A).toArray();
        }).subscribe(mockCallbackObj.items_A),
        liveQuery(() => {
          return store.itemsWithGroupPath.where('groupPath').startsWith(GROUP_PATH_B).toArray();
        }).subscribe(mockCallbackObj.items_B),
      );
      await sleep();
      await store.itemsWithGroupPath.put(ITEM_A_WITH_GROUP_PATH);
      await sleep();
      await store.itemsWithGroupPath.put({ ...ITEM_A_WITH_GROUP_PATH, id: '1234' });
      await sleep();
      expect(items_A_SpyOn).toBeCalledTimes(3); // one for first time subscription and the others because db mutations;
      expect(items_B_SpyOn).toBeCalledTimes(1); // one for first time subscription
    });
  });

  /**
   * Passed Tests
   * 
   * describe('Just Cheking its ok.', () => {
    it('On subscribing to live query in the first time, each callback run one time', async () => {
      //prepare
      await store.layers.bulkAdd([LAYER_A, LAYER_B]);
      subscriptions.push(
        liveQuery(() => {
          return getItemsByGroupPath(GROUP_PATH_A);
        }).subscribe(mockCallbackObj.items_A),
        liveQuery(() => {
          return getItemsByGroupPath(GROUP_PATH_B);
        }).subscribe(mockCallbackObj.items_B),
      );
      await sleep();

      //assert
      expect(items_A_SpyOn).toBeCalledTimes(1);
      expect(items_B_SpyOn).toBeCalledTimes(1);
    });
  });

   describe('Simple case of query', () => {
    it('Get all items by layerId -> On mutation only the LAYER_A subscriber got next', async () => {
      await store.layers.bulkAdd([
        LAYER_A,
        { ...LAYER_A, id: v4() },
        { ...LAYER_A, id: v4() },
        { ...LAYER_A, id: v4() },
        LAYER_B,
        { ...LAYER_B, id: v4() },
        { ...LAYER_B, id: v4() },
        { ...LAYER_B, id: v4() },
        { ...LAYER_B, id: v4() },
      ]);
      subscriptions.push(
        liveQuery(() => {
          return store.items.where('layerId').equals(LAYER_A.id).toArray();
        }).subscribe(mockCallbackObj.items_A),
        liveQuery(() => {
          return store.items.where('layerId').equals(LAYER_B.id).toArray();
        }).subscribe(mockCallbackObj.items_B),
      );
      await sleep();
      await store.items.put({ ...ITEM_A, id: v4() });
      await sleep();
      await store.items.put({ ...ITEM_A, id: '1234' });
      await sleep();
      expect(items_A_SpyOn).toBeCalledTimes(3); // one for first time subscription and the others because db mutations;
      expect(items_B_SpyOn).toBeCalledTimes(1); // one for first time subscription
    });

    it('Get all items by layerId using anyOf -> On mutation only the LAYER_A subscriber got next', async () => {
      const LAYER_A_IDS = ['111', '222', '333'];
      const LAYER_B_IDS = ['444', '555', '666'];
      await store.layers.bulkAdd([
        { ...LAYER_A, id: LAYER_A_IDS[0] },
        { ...LAYER_A, id: LAYER_A_IDS[1] },
        { ...LAYER_A, id: LAYER_A_IDS[2] },

        { ...LAYER_B, id: LAYER_B_IDS[0] },
        { ...LAYER_B, id: LAYER_B_IDS[1] },
        { ...LAYER_B, id: LAYER_B_IDS[2] },
      ]);
      await store.items.bulkPut([ITEM_A, ITEM_B]);
      subscriptions.push(
        liveQuery(() => {
          return store.items.where('layerId').anyOf(LAYER_A_IDS).toArray();
        }).subscribe(mockCallbackObj.items_A),
        liveQuery(() => {
          return store.items.where('layerId').anyOf(LAYER_B_IDS).toArray();
        }).subscribe(mockCallbackObj.items_B),
      );
      await sleep();
      await store.items.put({ ...ITEM_B, layerId: LAYER_B_IDS[0], id: '54565487' });
      await sleep();
      await store.items.put({ ...ITEM_A, layerId: LAYER_A_IDS[0], id: v4() });
      await sleep();
      await store.items.put({ ...ITEM_A, layerId: LAYER_A_IDS[1], id: '1234' });
      await sleep();
      expect(items_A_SpyOn).toBeCalledTimes(3); // one for first time subscription and the others because db mutations;
      expect(items_B_SpyOn).toBeCalledTimes(2); // one for first time subscription
    });
  });

  describe('Combine two kinds of liveQuery', () => {
    it('Adding item will trigger only the layer associated with it by layerId', async () => {
      store.layers.bulkAdd([
        LAYER_A,
        { ...LAYER_A, id: v4() },
        LAYER_B,
        { ...LAYER_B, id: v4() },
        { ...LAYER_B, id: v4() },
      ]);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const funcsObjs = { a: () => {}, b: () => {} };
      const spyOnA = jest.spyOn(funcsObjs, 'a');
      const spyOnB = jest.spyOn(funcsObjs, 'b');
      subscriptions.push(
        liveQuery(() => {
          return store.items.where('layerId').equals(LAYER_A.id).toArray();
        }).subscribe(mockCallbackObj.items_A),
        liveQuery(() => {
          return store.items.where('layerId').equals(LAYER_B.id).toArray();
        }).subscribe(mockCallbackObj.items_B),
        liveQuery(() => {
          return store.items.where('layerId').anyOf([LAYER_A.id]).toArray();
        }).subscribe(funcsObjs.a),
        liveQuery(() => {
          return store.items.where('layerId').anyOf([LAYER_B.id]).toArray();
        }).subscribe(funcsObjs.b),
      );
      await sleep();
      await store.items.put(ITEM_A);
      await sleep();
      await store.items.put({ ...ITEM_A, id: '1234' });
      await sleep();
      await store.items.put({ ...ITEM_A, id: '545254' });
      await sleep();
      await store.items.put({ ...ITEM_B, id: '6563235' });
      await sleep();
      expect(items_A_SpyOn).toBeCalledTimes(4);
      expect(items_B_SpyOn).toBeCalledTimes(2);
      expect(spyOnA).toBeCalledTimes(4);
      expect(spyOnB).toBeCalledTimes(2);
    });
  });
   */

  /** Failed Tests 
   * describe('Working with seperated queries and RX, case of more than 3 layers in the table.', () => {
    it('Adding item will trigger only the layer associated with it by layerId', async () => {
      await store.layers.bulkAdd([LAYER_A, { ...LAYER_A, id: v4() }, LAYER_B, { ...LAYER_B, id: v4() }]);
      subscriptions.push(
        createItemsByGroupPath(GROUP_PATH_A).subscribe(mockCallbackObj.items_A),
        createItemsByGroupPath(GROUP_PATH_B).subscribe(mockCallbackObj.items_B),
      );
      await sleep();
      await store.items.put({ ...ITEM_A, id: '1234' });
      await sleep();
      await store.items.put({ ...ITEM_B, id: '112233' });
      await sleep();
      await store.items.put({ ...ITEM_A, id: '5678' });
      await sleep();
      expect(items_A_SpyOn).toBeCalledTimes(3);
      expect(items_B_SpyOn).toBeCalledTimes(2);
    });
  });
  */
});
