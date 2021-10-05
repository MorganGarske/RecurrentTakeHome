export type VehicleData = {
    vehicleId: string,
    chargeReading: number,
    rangeEstimate: number,
    odometer: number,
    pluggedIn: boolean,
    charging: boolean,
    createdAt: number, // Date in milliseconds since epoch
}
