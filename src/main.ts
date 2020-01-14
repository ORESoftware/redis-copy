'use strict';

import {any} from "async";

export const r2gSmokeTest = function () {
  // r2g command line app uses this exported function
  return true;
};


import * as Redis from 'ioredis';
import * as async from 'async';

export type EVCb<T = any, E = any> = (err?: E, val?: T) => void;
export type Task<T> = (cb: EVCb<T>) => void;


const redis = new Redis({
  port: 6379,
  db: 0
});

const redis2 = new Redis({
  port: 6379,
  db: 1
});


export const run = (cb: EVCb<void>) => {

  const q = async.queue<Task<any>>((task, cb) => task(cb), 3);

  const add = (scanCount: number) => {

    q.push(async cb => {

      try {
        const [x, v] = await redis.scan(scanCount);

        if(v.length < 1){
          return cb(null);
        }

        add(scanCount + 5000);

        const d: Array<any> = await redis.mget(...v);

        let i = 0;

        const z = v.reduce((a,b) => (a.set(b, d[i++]), a), new Map());

        await redis2.mset(z);

      } catch (e) {
        return cb(e);
      }

      cb(null);

    }, err => {

      if (err) {
        console.error(err);
      }

    });

  };


  add(0);
  q.drain(cb);

};


