import { liveQuery, Subscription } from 'dexie';
import 'fake-indexeddb/auto';
import { store } from '../../src/store';
import {
  populateDB,
  mockCallbackObj,
  getItemsByGroupPath,
  GROUP_PATH_A,
  GROUP_PATH_B,
  sleep,
  ITEM_A,
  createItemsByGroupPath,
  LAYER_A,
  ITEM_B,
} from '../commonSetup';

describe('liveQuery reactivity tests', () => {
  const subscriptions: Subscription[] = [];
  let items_A_SpyOn: any;
  let items_B_SpyOn: any;

  beforeEach(async () => {
    populateDB();
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

  describe('Just Cheking its ok.', () => {
    it('On subscribing to live query in the first time, each callback run one time', async () => {
      subscriptions.push(
        liveQuery(() => {
          return getItemsByGroupPath(GROUP_PATH_A);
        }).subscribe(mockCallbackObj.items_A),
        liveQuery(() => {
          return getItemsByGroupPath(GROUP_PATH_B);
        }).subscribe(mockCallbackObj.items_B),
      );
      await sleep();
      expect(items_A_SpyOn).toBeCalledTimes(1);
      expect(items_B_SpyOn).toBeCalledTimes(1);
    });
  });

  describe('Putting all in the same liveQuery pass the tests.', () => {
    it('Adding item will trigger only the layer associated with it by layerId', async () => {
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
      expect(items_A_SpyOn).toBeCalledTimes(3); // one for first time subscription and the others becuse db mutations;
      expect(items_B_SpyOn).toBeCalledTimes(1); // one for first time subscription
    });
  });

  describe('Working with seperated queries and RX,working also.', () => {
    it('Adding item will trigger only the layer associated with it by layerId', async () => {
      subscriptions.push(
        createItemsByGroupPath(GROUP_PATH_A).subscribe(mockCallbackObj.items_A),
        createItemsByGroupPath(GROUP_PATH_B).subscribe(mockCallbackObj.items_B),
      );
      await sleep();
      // await store.layers.put({
      //   ...LAYER_A,
      //   id: ' id ביקה דגכדגכ starts with space and contained wired charcters like ||| $$$ ^^',
      // });
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
});
