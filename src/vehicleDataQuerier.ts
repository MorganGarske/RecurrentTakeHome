import {VehicleDao} from './vehicleDao';

const MS_IN_DAY = 24 * 60 * 60 * 1000;
/**
 * Provides queries on datasets of electric vehicles.
 */
export class VehicleDataQuerier {
  dao: VehicleDao;

  /**
   * @param {VehicleDao} dao Data Access Object for retrieving vehicle data.
   */
  constructor(dao: VehicleDao) {
    this.dao = dao;
  }

  /**
   * Returns the average daily miles driven for the given vehicle based on the
   * minimum and maximum odometer reading for the given vehicle and the total
   * duration of the dataset in days.
   * @param {string} vehicleId Id of the given vehicle.
   * @return {number} Average daily miles driven by vehicle over the course of the dataset.
   * @throws {Error} If vehicleId not found in dataset.
   */
  averageDailyMiles(vehicleId: string): number {
    const vehicleData = this.dao.getVehicleData();
    let minDate = vehicleData[0].createdAt;
    let maxDate = vehicleData[0].createdAt;
    let minOdo = Number.MAX_SAFE_INTEGER;
    let maxOdo = Number.MIN_SAFE_INTEGER;
    let vehFound = false;

    for (const v of vehicleData) {
      maxDate = Math.max(v.createdAt, maxDate);
      minDate = Math.min(v.createdAt, minDate);
      if (v.vehicleId === vehicleId) {
        vehFound = true;
        minOdo = Math.min(minOdo, v.odometer);
        maxOdo = Math.max(maxOdo, v.odometer);
      }
    }

    if (vehFound) {
      // Calculate decimal value of days between the earliest and latest data point in the provided dataset.
      // todo: clarify how days should be calculated (see discussion in README.md).
      const daysInDataset = (maxDate - minDate)/(MS_IN_DAY);
      return (maxOdo - minOdo) / daysInDataset;
    } else {
      throw new Error(`Cannot find vehicle with id "${vehicleId}" in dataset.`);
    }
  }

  /**
   * Counts the number of vehicles that reported charged above a certain amount over the dataset.
   * @param {number} threshold Threshold percent to count vehicles charged above, in decimal format.
   * @return {number} The number of vehicles with at least one datapoint above the threshold.
   */
  chargedAbove(threshold: number): number {
    if (isNaN(threshold) || threshold < 0 || threshold >= 1) {
      throw new Error('charged_above threshold must be a decimal number between ' +
                      `0 (inclusive) and 1 (exclusive). Provided: ${threshold}`);
    }
    const vehChargedAbove = new Set();
    for (const v of this.dao.getVehicleData()) {
      if (v.chargeReading > threshold) {
        vehChargedAbove.add(v.vehicleId);
      }
    }
    return vehChargedAbove.size;
  }
}
