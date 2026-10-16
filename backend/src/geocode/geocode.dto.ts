import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude } from 'class-validator';

/** GET /geocode/reverse?lat=23.779&lng=90.41 */
export class ReverseGeocodeQuery {
  @Type(() => Number)
  @IsLatitude()
  lat: number;

  @Type(() => Number)
  @IsLongitude()
  lng: number;
}