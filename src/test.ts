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

export const test = (cb: EVCb<void>) => {

  const q = async.queue<Task<any>>((task, cb) => task(cb), 3);

  let count = 5000;
  let scanCount: number = -1;

  const getNext = () : number => {
    return scanCount = scanCount + 1;
  };

  const existingKeys = new Set<string>();

  const add = (scanCount: number) => {

    q.push(async cb => {

      try {

        const [x, v] = await redis.scan(scanCount, 'COUNT', count);

        let num = parseInt(x);

        if(Number.isNaN(num)){
          throw 'Not a num.';
        }

        // console.log("keys", v);

        for(let k of v){
            existingKeys.add(k);
        }

        if( num !== 0){
          console.log('empty 0');
          add(num);
        }


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


//   q.drain(() => {

//     // throw 'agage';

//     let x = 0;
//     let i = 0;

//     let next : Array<string>= [];

//     async.whilst(() => {

//         next = Array.from(existingKeys).slice(x*50, 50).filter(Boolean);
//         x++;
//         return next.length > 0;

//     },   cb => {


//         (async () => {

//             const values1 = await redis.mget(...next)
//             const values2 = await redis2.mget(...next);
    
//             for(let i = 0; i < values1.length; i++){

//                 console.log({i});
//                 const val1 = values1[i];
//                 const val2 = values2[i];
//                 console.log({val1,val2})
    
//                 if(val1 !== val2){
//                     return cb(new Error([val1, val2, 'are not equal'].toString()));
//                 }
//             }
               
    
//                 i++

//                 cb(null);

//         })()
      

//     }, err => {

//         if(err) throw err;
//         console.log('all done..');
//         process.exit(1);

//     });


//   });



  q.drain(() => {


    // throw 'wtf';

    let i = 0;

    const newSet = new Set();

    async.eachLimit(Array.from(existingKeys), 20, (v, cb) => {

        newSet.add(v);

        redis.get(v, (err: Error, val1: string | null) => {

            if(err){
                return cb(err);
            }

          redis2.get(v, (err: any, val2: string | null) => {

            if(err){
                return cb(err);
            }

            console.log({i});
            console.log({val1,val2})

            if(val1 !== val2){
                return cb(new Error([val1, val2, 'are not equal'].toString()))
            }

            i++

            cb(null);

          });


        });


    }, err => {

        if(err) throw err;

        if(i !== 50000){
            throw 'not enough keys'
        }

        if(newSet.size !== 50000){
            throw 'not enough unique keys'
        }

        console.log('i final value:',{i});

        cb(null);
    }) 

  });

};




test(err => {
    if(err) throw err;
    console.log('all done all good')
})