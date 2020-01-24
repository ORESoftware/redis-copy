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
  port: 6000,
  db: 0
});

const redis2 = new Redis({
  port: 7000,
  db: 0
});

export default (cb: EVCb<void>) => {

  const q = async.queue<Task<any>>((task, cb) => task(cb), 3);

  let count = 5000;
  let scanCount: number = -1;

  const getNext = () : number => {
    return scanCount = scanCount + 1;
  };

  const existingKeys = new Set();

  const add = (scanCount: number) => {

    q.push(async cb => {

      try {

        const [x, v] = await redis.scan(scanCount, 'COUNT', count);

        let num = parseInt(x);

        if(Number.isNaN(num)){
          throw 'Not a num.';
        }

        console.log("keys", v);

        if( num !== 0){
          console.log('empty 0');
          add(num);
        }

        if(v.length < 1){
          console.log('empty 1');
          return cb(null);
        }

        const d: Array<any> = (await redis.mget(...v))
        // .filter(v => {
        //   let z = !existingKeys.has(v);
        //   existingKeys.add(v);
        //   return z;
        // });

        console.log({d})


        // if(d.length < 1){
        //   console.log('empty 2');
        //   return cb(null);
        // }

        let i = 0;

        const z = v.reduce((a,b) => (a.set(b, d[i++]), a), new Map());

        console.log({z})

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
  // add(1);
  // add(2);

  q.drain(cb);

};


