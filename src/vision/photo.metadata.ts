/**
 * EXIF / GPS extraction for photo ingestion (date, location).
 */
import ExifReader from 'exifreader';
import fs from 'fs';

export interface PhotoExif {
  date?: string;
  location?: string;
  gps?: { lat: string; lon: string };
}

export function extractExif(filePath: string): PhotoExif {
  const buffer = fs.readFileSync(filePath);
  const tags = ExifReader.load(buffer);
  const result: PhotoExif = {};

  const dateTag = tags['DateTimeOriginal'] ?? tags['DateTime'];
  if (dateTag?.description) {
    result.date = String(dateTag.description).trim();
  }

  const latTag = tags['GPSLatitude'];
  const lonTag = tags['GPSLongitude'];
  if (latTag?.description != null && lonTag?.description != null) {
    result.gps = {
      lat: String(latTag.description),
      lon: String(lonTag.description),
    };
    result.location = `${result.gps.lat}, ${result.gps.lon}`;
  }

  return result;
}
