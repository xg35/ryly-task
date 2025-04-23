// Extend PositionOptions to include distanceFilter
interface ExtendedPositionOptions extends PositionOptions {
  distanceFilter?: number;
}

/**
 * Represents a geographical location with latitude and longitude coordinates.
 */
export interface Location {
  /**
   * The latitude of the location.
   */
  lat: number;
  /**
   * The longitude of the location.
   */
  lng: number;
}

/**
 * Asynchronously retrieves the current geographical location.
 * Requests permission if not already granted.
 *
 * @returns A promise that resolves to a Location object containing latitude and longitude.
 * @throws Error if permission is denied or geolocation is unavailable
 */
export async function getCurrentLocation(): Promise<Location> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Checks if geolocation permission has been granted
 * @returns Promise that resolves to true if permission granted, false otherwise
 */
export async function hasLocationPermission(): Promise<boolean> {
  if (!navigator.permissions) {
    // Permissions API not available, fallback to trying to get location
    try {
      await getCurrentLocation();
      return true;
    } catch {
      return false;
    }
  }

  const result = await navigator.permissions.query({ name: 'geolocation' });
  return result.state === 'granted';
}

/**
 * Watches user position and calls callback with updates
 * @param callback Function to call with position updates
 * @param interval Update interval in milliseconds (default 15000)
 * @returns Watch ID that can be used to clear the watch
 */
export function watchUserPosition(
  callback: (location: Location) => void,
  interval: number = 15000
): number {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser');
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    },
    (error) => {
      console.error('Geolocation watch error:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: interval
    } as ExtendedPositionOptions
  );
}

/**
 * Clears a position watch
 * @param watchId The ID returned by watchUserPosition
 */
export function clearPositionWatch(watchId: number): void {
  navigator.geolocation.clearWatch(watchId);
}
