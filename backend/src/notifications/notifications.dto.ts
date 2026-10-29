import { IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

/** Expo push token from the phone, e.g. "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]". */
const EXPO_PUSH_TOKEN = /^Expo(nent)?PushToken\[[^\]]+\]$/;

/** POST / DELETE /notifications/token */
export class PushTokenDto {
  @IsString()
  @MaxLength(200)
  @Matches(EXPO_PUSH_TOKEN, { message: 'Invalid push token.' })
  token: string;
}

/** GET /notifications?before=<id of the last item already shown> */
export class ListNotificationsQuery {
  @IsOptional()
  @IsUUID()
  before?: string;
}