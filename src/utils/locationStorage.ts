import { ILocationTrack } from "../modules/Location/location.interface";

export default class LocationStorage {
  private userLocations: Record<string, ILocationTrack[]> = {};
  private archivedLocations: Record<string, ILocationTrack[]> = {};

  constructor(initialData: Record<string, ILocationTrack[]> = {}) {
    this.userLocations = initialData;
  }

  addLocations(userId: string, newLocations: ILocationTrack[]) {
    if (!this.userLocations[userId]) {
      this.userLocations[userId] = [];
    }
    this.userLocations[userId].push(...newLocations);
  }

  getAllTrackedData(): Record<string, ILocationTrack[]> {
    const allData: Record<string, ILocationTrack[]> = {};

    // Ensure archived data is always included even if userLocations is cleared
    for (const userId in this.userLocations) {
      const currentLocations = this.userLocations[userId] || [];
      const archivedLocations = this.archivedLocations[userId] || [];

      // Ensure both archived and current locations are returned, even if one is empty
      allData[userId] = [...archivedLocations, ...currentLocations];
    }

    return allData;
  }

  getLocations(userId: string): ILocationTrack[] {
    return this.userLocations[userId] || [];
  }

  clearLocations(userId: string) {
    // Clear current locations and ensure archived locations remain
    if (this.userLocations[userId]) {
      this.userLocations[userId] = [];
    }
  }

  clearAllLocations(userId: string) {
    // Clear current locations and ensure archived locations remain
    if (this.userLocations[userId]) {
      this.userLocations[userId] = [];
    }
    if (this.archivedLocations[userId]) {
      this.archivedLocations[userId] = [];
    }
  }

  archiveLocations(userId: string) {
    if (this.userLocations[userId] && this.userLocations[userId].length > 0) {
      if (!this.archivedLocations[userId]) {
        this.archivedLocations[userId] = [];
      }

      // Add the current locations to archived storage
      this.archivedLocations[userId].push(...this.userLocations[userId]);
      // Clear the userLocations after archiving
      this.clearLocations(userId);
    }
  }

  getArchivedUserData(userId: string): ILocationTrack[] {
    return this.archivedLocations[userId] || [];
  }

  count(userId: string): number {
    return (
      (this.userLocations[userId]?.length || 0) +
      (this.archivedLocations[userId]?.length || 0)
    );
  }

  clearAll() {
    this.userLocations = {};
    this.archivedLocations = {};
  }
}
