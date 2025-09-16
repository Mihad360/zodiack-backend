// import { ILocationTrack } from "../modules/Location/location.interface";

// export default class LocationStorage {
//   // Internal array to store locations
//   private locations: ILocationTrack[] = [];

//   constructor(initialLocations: ILocationTrack[] = []) {
//     this.locations = initialLocations;
//   }

//   /**
//    * Add new locations to the storage
//    * @param newLocations Array of ILocationTrack
//    */
//   addLocations(newLocations: ILocationTrack[]) {
//     this.locations = [...this.locations, ...newLocations];
//   }

//   /**
//    * Get all stored locations
//    * @returns Array of ILocationTrack
//    */
//   getAllLocations(): ILocationTrack[] {
//     return [...this.locations]; // return a copy to prevent external mutation
//   }

//   /**
//    * Clear all stored locations
//    */
//   clearLocations() {
//     this.locations = [];
//   }

//   /**
//    * Get the number of stored locations
//    */
//   count(): number {
//     return this.locations.length;
//   }
// }

import { ILocationTrack } from "../modules/Location/location.interface";

export default class LocationStorage {
  // Each userId gets its own location array
  private userLocations: Record<string, ILocationTrack[]> = {};

  constructor(initialData: Record<string, ILocationTrack[]> = {}) {
    this.userLocations = initialData;
  }

  /**
   * Add new locations for a specific user
   * If the user is new, create a new array
   */
  addLocations(userId: string, newLocations: ILocationTrack[]) {
    if (!this.userLocations[userId]) {
      this.userLocations[userId] = [];
    }
    // Append to the existing array, never overwrite other users
    this.userLocations[userId].push(...newLocations);
  }

  /**
   * Get all locations for a specific user
   */
  getLocations(userId: string): ILocationTrack[] {
    return this.userLocations[userId] ? [...this.userLocations[userId]] : [];
  }

  /**
   * Clear locations for a specific user
   */
  clearLocations(userId: string) {
    if (this.userLocations[userId]) {
      this.userLocations[userId] = [];
    }
  }

  /**
   * Get count of locations for a specific user
   */
  count(userId: string): number {
    return this.userLocations[userId]?.length || 0;
  }

  /**
   * Optional: get all users stored
   */
  getAllUsers(): string[] {
    return Object.keys(this.userLocations);
  }

  /**
   * Optional: clear everything
   */
  clearAll() {
    this.userLocations = {};
  }
}
