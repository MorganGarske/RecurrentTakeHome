#!/usr/bin/env node

import {argv} from 'process';
import {FileBasedVehicleDao} from './vehicleDao';
import {VehicleDataQuerier} from './vehicleDataQuerier';

try {
  if (argv.length < 5) {
    throw new Error('Incorrect number of arguments.');
  }
  const [pathToCsv, query, arg] = argv.slice(2, 5);

  const dao = new FileBasedVehicleDao(pathToCsv.toString());
  const querier = new VehicleDataQuerier(dao);

  let result;
  if (query === 'charged_above') {
    const threshold = Number(arg);
    if (isNaN(threshold)) {
      throw new Error('Argument provided to "charged_above" query must be a decimal ' +
        `number between 0 (inclusive) and 1 (exclusive). Provided: "${arg}"`);
    }
    result = querier.chargedAbove(threshold);
  } else if (query === 'average_daily_miles') {
    result = querier.averageDailyMiles(arg);
  } else {
    throw new Error(`Query "${query}" not recognized.`);
  }

  console.log(`Result of ${query} query: ${result}`);
} catch (e) {
  console.error(`Could not run query. ${e}`);
  console.log('Usage: `vehquery <path_to_csv> <query_name> <query_argument>`\n' +
              'Examples:\n' +
              'vehquery data/data.csv charged_above 0.33\n' +
              'vehquery data/data.csv average_daily_miles cat-car');
}
