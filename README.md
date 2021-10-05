# Recurrent Vehicle Data Query CLI

## Running
Requires Node.js (developed with v14.16.1) - [download](https://nodejs.org/en/download/)

- `npm install` to install dependencies.
- `npm install -g` to install `vehquery` executable to system. Can run with `npx vehquery <args>` or `vequery <args>` (if running scripts enabled)
- `npm start <args>` to run locally, `npm test` to run tests, `npm run build` to run Typescript compiler and linter.
- `npm run dev <args>` to run with nodemon (refreshes on code change)
- `npm run clean` to clean lib and node_modules directories.

### Quick start
1. run `npm install`
2. run `npm start ./data/ev_data.csv charged_above 0.33`
3. run `npm start ./data/ev_data.csv average_daily_miles cat-car`

## Usage
`vehquery <path_to_csv> <query_name> <query_argument>`

### Charged Above
This query returns the number of vehicles that reported at least one `charge_reading` above a given % (expressed as a decimal) for the given dataset.

`vehquery <path_to_csv> charged_above <percent_charged_in_decimal>`

For example, if we want to count how many cars were at one point charged above 40% in the dataset stored at `./data/ev_data.csv`, we would run:

`vehquery ./data/ev_data.csv charged_above 0.40`

### Average Daily Miles
This query returns the average daily miles for a given vehicle over the course of the time period of the dataset.

`vehquery <path_to_csv> average_daily_miles <vehicle_id>`

For example, if we want to calculate the average daily miles for the vehicle with `vehicle_id` "cat-car" in the dataset stored at `./data/ev_data.csv`, we would run:

`vehquery ./data/ev_data.csv average_daily_miles cat-car`

# Assumptions
## Time Range/Day Calculation
For the purposes of average daily mile calculation, I have assumed, for simplicity, that the value we wish to divide the miles driven by is the difference between the earliest and latest timestamps in the dataset, in days. This means that if a vehicle drove 300 miles between Monday 6am and Tuesday 6pm, we would consider 36 hours or 1.5 days elapsed, so average miles driven = 300/1.5 = 200.

There is some ambiguity here because it might seem more intuitive to consider the number of discrete days the dataset ranges over. For example, if one data point occured at 12pm on Mon and another at 12pm on Tues, then some could consider this 2 days, but the current implementation considers it 1. To reflect this intuition, we may also need to consider the timezone the vehicle or user is located in. 

Overall, this has little impact on the result of the query outside of edge cases, so it would require a discussion with product/data scientists to see if we need to change the current implementation to something more complicated.

## Others
- Data is stored in CSV with delimiter "," and the following columns expressed as the first line: `vehicle_id,charge_reading,range_estimate,odometer,plugged_in,charging,created_at`.
- All columns are populated for every vehicle.
- Data is valid (see `todo` in vehicleDao.ts that mentions additional data validation).
- The desired implmentation of average_daily_miles considers the miles driven by a vehicle over the total time range of the provided dataset - regardless of whether that vehicle was active and/or reporting during the full range. e.g. a vehicle reported for 2 days but the dataset was for 2 weeks, so we would divide the distance traveled by 14 days rather than 2 days.
- We want an error thrown when a vehicle id was provided for average_daily_miles that was not found in the data set. Alternatively, we could return 0, but this behavior would not distinguish between a vehicle was not in the dataset vs a vehicle that was not driven during the dataset.
- Odometer readings always go up over time. Odometer readings going down over time would be a result of data corruption/tampering and assumed to be handled closer to data ingestion.

# Improvements
* Additional data validation in FileBasedVehicleDao. Currently, assumes anything that is not `"true"` (case insensitive) is `false` for booleans, and doesn't validate numbers or Date format when parsing.
* Add more specific error classes e.g. for vehicle not found. Currently all errors thrown are of type `Error`, which doesn't allow for nuanced error handling. 
* Tests for FileBasedVehicleDao (more relevant if data validation added).
* CLI currently does not handle queries with more than 1 argument.
* VehicleDataQuerier is very general in purpose - could become dumping ground if more queries are added. Consider splitting this out into more specialized modules. 
* Add testing coverage check to build.

# Task 2
## Implement `drove_nowhere` query

As a \<query user\>, I would like to be able to run a query on a dataset which gives me a count of the number of vehicles which did not drive anywhere on a given date, so that \<reason\>.

* Add a new query to vehicleDataQuerier which takes in a date string in `YYYY-MM-DD` format and returns the number (integer) of vehicles which had unchanged odometer readings in the given dataset.
* Update CLI interface defined by index.ts to accept "`drove_nowhere <date_string>`" as a valid query.
* Clarify whether the date expressed is in UTC. The timestamps in the dataset are expected to be in UTC timezone, so if there is timezone information that needs to be provided or assumed with the given date, the timestamps should be converted to line up with the expected timezone.
* Validate assumption that odometers only go up as time goes on. If not, clarify whether odometer readings going down contribute to drove_nowhere count or not.