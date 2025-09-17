import { ILocationTrack } from "../modules/Location/location.interface";

export default class LocationStorage {
  // Each userId gets its own location array
  private userLocations: Record<string, ILocationTrack[]> = {};
  // Stores archived data when the buffer reaches 50
  private archivedLocations: Record<string, ILocationTrack[]> = {};

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

  // Get all users' location data, including both current and archived data
  getAllTrackedData(): Record<string, ILocationTrack[]> {
    // Combine current user locations and archived locations
    const allData: Record<string, ILocationTrack[]> = {};

    for (const userId in this.userLocations) {
      const currentLocations = this.userLocations[userId] || [];
      const archivedLocations = this.archivedLocations[userId] || [];

      // Combine both current and archived locations for each user
      allData[userId] = [...archivedLocations, ...currentLocations];
    }

    return allData;
  }

  /**
   * Get all locations for a specific user
   */
  getLocations(userId: string): ILocationTrack[] {
    // Only return the current locations (not archived)
    return this.userLocations[userId] || [];
  }

  /**
   * Clear locations for a specific user
   */
  clearLocations(userId: string) {
    if (this.userLocations[userId]) {
      this.userLocations[userId] = []; // Clear current locations
    }

    if (this.archivedLocations[userId]) {
      this.archivedLocations[userId] = []; // Clear archived locations as well
    }
  }

  /**
   * Get count of locations for a specific user
   */
  count(userId: string): number {
    return (
      (this.userLocations[userId]?.length || 0) +
      (this.archivedLocations[userId]?.length || 0)
    );
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
    this.archivedLocations = {};
  }

  // Method to add data to archived storage when buffer is cleared
  archiveLocations(userId: string) {
    if (this.userLocations[userId] && this.userLocations[userId].length > 0) {
      if (!this.archivedLocations[userId]) {
        this.archivedLocations[userId] = [];
      }
      // Add the current locations to the archived storage
      this.archivedLocations[userId].push(...this.userLocations[userId]);
      // Clear the buffer after archiving
      this.clearLocations(userId);
    }
  }

  // Method to retrieve all archived data for a specific user
  getArchivedUserData(userId: string): ILocationTrack[] {
    return this.archivedLocations[userId] || [];
  }
}
