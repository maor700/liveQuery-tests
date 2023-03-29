import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { store } from '../../store';

export const App = (): JSX.Element => {
  const items = useLiveQuery(() => store.items.toArray(), [], []);
  return (
    <div className="app-con">
      <h2>My Store - dexie.js liveQuery tests</h2>
      <div className="items-con">
        <div className="group-path-1">
          <h3>items</h3>
          {items?.map((item) => (
            <div key={item.id}>{item.name}</div>
          ))}
        </div>
        <div className="group-path-2"></div>
      </div>
    </div>
  );
};
