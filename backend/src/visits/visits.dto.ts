import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

/** Visit times the app offers (Bangladesh time). Kept in sync with the app's TIME_SLOTS. */
export const VISIT_TIME_SLOTS = ['10:00', '12:00', '14:00', '16:00', '18:00'] as const;

export class CreateVisitDto {
  @IsUUID()
  propertyId: string;

  /** "YYYY-MM-DD" (Bangladesh date) */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @IsIn(VISIT_TIME_SLOTS, { message: 'Please pick one of the available times.' })
  time: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class RespondVisitDto {
  @IsIn(['confirm', 'decline'])
  decision: 'confirm' | 'decline';
}

export class MyVisitsQuery {
  /** Only visits for this property */
  @IsOptional()
  @IsUUID()
  propertyId?: string;
}