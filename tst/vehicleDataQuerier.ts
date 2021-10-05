import {expect} from 'chai';
import {VehicleData} from '../src/model';
import {VehicleDao} from '../src/vehicleDao';
import {VehicleDataQuerier} from '../src/vehicleDataQuerier';

describe('charged_above query', () => {
  let vehicleData: VehicleData[] = [];

  const mockDao: VehicleDao = {
    getVehicleData: function(): VehicleData[] {
      return vehicleData;
    },
  };

  const querier = new VehicleDataQuerier(mockDao);

  vehicleData = [
    {
      vehicleId: 'cat-car',
      chargeReading: 0.2,
      rangeEstimate: 40,
      odometer: 1200,
      pluggedIn: true,
      charging: true,
      createdAt: Date.parse('2020-01-01 12:01:03'),
    },
    {
      vehicleId: 'dog-car',
      chargeReading: 0.3,
      rangeEstimate: 40,
      odometer: 1200,
      pluggedIn: true,
      charging: true,
      createdAt: Date.parse('2020-01-01 12:01:03'),
    },
  ];

  it('counts charged above threshold', () => {
    expect(querier.chargedAbove(0.1)).to.eql(2);
  });

  it('excludes below threshold', () => {
    expect(querier.chargedAbove(0.2)).to.eql(1);
  });

  it('returns zero for no matching', () => {
    expect(querier.chargedAbove(0.3)).to.eql(0);
  });

  it('throws error for below 0', () => {
    expect(() => querier.chargedAbove(-1)).to.throw();
  });

  it('throws error for 1 or above', () => {
    expect(() => querier.chargedAbove(1)).to.throw();
    expect(() => querier.chargedAbove(1.1)).to.throw();
  });

  it('throws error for NaN', () => {
    expect(() => querier.chargedAbove(NaN)).to.throw();
  });
});

describe('average_daily_miles query', () => {
  let vehicleData: VehicleData[] = [];

  const mockDao: VehicleDao = {
    getVehicleData: function(): VehicleData[] {
      return vehicleData;
    },
  };

  const querier = new VehicleDataQuerier(mockDao);

  vehicleData = [
    {
      vehicleId: 'dog-car',
      chargeReading: 0.3,
      rangeEstimate: 40,
      odometer: 1200,
      pluggedIn: true,
      charging: true,
      createdAt: Date.parse('2020-01-01 12:01:03'),
    },
    {
      vehicleId: 'dog-car',
      chargeReading: 0.3,
      rangeEstimate: 40,
      odometer: 1200,
      pluggedIn: true,
      charging: true,
      createdAt: Date.parse('2020-01-02 12:01:03'),
    },
    {
      vehicleId: 'dog-car',
      chargeReading: 0.3,
      rangeEstimate: 40,
      odometer: 1400,
      pluggedIn: true,
      charging: true,
      createdAt: Date.parse('2020-01-05 12:01:03'),
    },
    {
      vehicleId: 'cat-car',
      chargeReading: 0.2,
      rangeEstimate: 40,
      odometer: 100,
      pluggedIn: true,
      charging: true,
      createdAt: Date.parse('2020-01-01 12:01:03'),
    },
    {
      vehicleId: 'cat-car',
      chargeReading: 0.2,
      rangeEstimate: 40,
      odometer: 400,
      pluggedIn: true,
      charging: true,
      createdAt: Date.parse('2020-01-02 12:01:03'),
    },
    {
      vehicleId: 'clown-car',
      chargeReading: 0.2,
      rangeEstimate: 40,
      odometer: 400,
      pluggedIn: true,
      charging: true,
      createdAt: Date.parse('2020-01-02 12:01:03'),
    },
    {
      vehicleId: 'clown-car',
      chargeReading: 0.2,
      rangeEstimate: 40,
      odometer: 400,
      pluggedIn: true,
      charging: true,
      createdAt: Date.parse('2020-01-03 12:01:03'),
    },
  ];

  it('calculates average for a single car', () => {
    expect(querier.averageDailyMiles('dog-car')).to.eql(50);
  });

  it('uses the duration of the whole dataset', () => {
    expect(querier.averageDailyMiles('cat-car')).to.eql(75);
    // would be 300 if only considering data points for given vehicle.
  });

  it('returns zero for car that does not move.', () => {
    expect(querier.averageDailyMiles('clown-car')).to.eql(0);
  });

  it('uses partial day in average calculation', () => {
    vehicleData = [
      {
        vehicleId: 'cat-car',
        chargeReading: 0.2,
        rangeEstimate: 40,
        odometer: 100,
        pluggedIn: true,
        charging: true,
        createdAt: Date.parse('2020-01-01 01:01:03'),
      },
      {
        vehicleId: 'cat-car',
        chargeReading: 0.2,
        rangeEstimate: 40,
        odometer: 400,
        pluggedIn: true,
        charging: true,
        createdAt: Date.parse('2020-01-01 13:01:03'),
      },
    ];
    expect(querier.averageDailyMiles('cat-car')).to.eql(600);
  });

  it('considers day duration based on elapsed time', () => {
    vehicleData = [
      {
        vehicleId: 'cat-car',
        chargeReading: 0.2,
        rangeEstimate: 40,
        odometer: 100,
        pluggedIn: true,
        charging: true,
        createdAt: Date.parse('2020-01-01 01:01:03'),
      },
      {
        vehicleId: 'cat-car',
        chargeReading: 0.2,
        rangeEstimate: 40,
        odometer: 400,
        pluggedIn: true,
        charging: true,
        createdAt: Date.parse('2020-01-02 01:01:03'),
      },
    ];
    expect(querier.averageDailyMiles('cat-car')).to.eql(300);
  });

  // Note: this test asserts something that is potentially undesirable,
  // but we assume that odometer can only go up. If odometer goes down over time,
  // this could be a data corruption (or tampering) issue and should be handled closer
  // to data ingestion.
  it('does not account for decreasing odometer', () => {
    vehicleData = [
      {
        vehicleId: 'cat-car',
        chargeReading: 0.2,
        rangeEstimate: 40,
        odometer: 400,
        pluggedIn: true,
        charging: true,
        createdAt: Date.parse('2020-01-01 01:01:03'),
      },
      {
        vehicleId: 'cat-car',
        chargeReading: 0.2,
        rangeEstimate: 40,
        odometer: 100,
        pluggedIn: true,
        charging: true,
        createdAt: Date.parse('2020-01-02 01:01:03'),
      },
    ];
    expect(querier.averageDailyMiles('cat-car')).to.eql(300);
  });

  // Due to duration being 0, this will divide by zero resulting in NaN.
  // todo: clarify if an error should be thrown instead.
  it('returns NaN for dataset with no duration', () => {
    vehicleData = [
      {
        vehicleId: 'cat-car',
        chargeReading: 0.2,
        rangeEstimate: 40,
        odometer: 400,
        pluggedIn: true,
        charging: true,
        createdAt: Date.parse('2020-01-01 01:01:03'),
      },
    ];
    expect(querier.averageDailyMiles('cat-car')).to.eql(NaN);
  });

  it('throws error for id not found', () => {
    expect(() => querier.averageDailyMiles('horse-car')).to.throw();
  });
});
