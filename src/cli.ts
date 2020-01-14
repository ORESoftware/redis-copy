#!/usr/bin/env node
'use strict';

import {run} from './main';


run(err => {
  if (err) throw err;
  console.log('done');
})
