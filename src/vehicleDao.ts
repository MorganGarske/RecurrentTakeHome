import parse = require('csv-parse/lib/sync');
import {readFileSync} from 'fs';
import {VehicleData} from './model';

export interface VehicleDao {
  getVehicleData(): VehicleData[];
};

/**
 * DAO for accessing vehicle data source and providing this data to other components.
 */
export class FileBasedVehicleDao implements VehicleDao {
  private vehicleData: VehicleData[];

  /**
   * @param {string} pathToData Path to CSV file.
   */
  constructor(pathToData: string) {
    const contents = readFileSync(pathToData);
    const records = parse(contents, {
      columns: true,
      skip_empty_lines: true,
    });

    this.vehicleData = records.map((r: any) => {
      // todo: Improve validation/error handling. Number and Date fields could be invalid.
      // For boolean, considers anything other than 'true' (case insensitive) to be false.
      return {
        vehicleId: r.vehicle_id,
        chargeReading: r.charge_reading,
        rangeEstimate: r.range_estimate,
        odometer: r.odometer,
        pluggedIn: r.plugged_in.toLowerCase() === 'true' ? true : false,
        charging: r.charging.toLowerCase() === 'true' ? true : false,
        createdAt: Date.parse(r.created_at),
      };
    });
  }

  /**
   * Returns all vehicle data in the loaded dataset.
   * @return {VehicleData[]} Vehicle data in the loaded dataset.
   */
  getVehicleData(): VehicleData[] {
    return this.vehicleData;
  }
}
