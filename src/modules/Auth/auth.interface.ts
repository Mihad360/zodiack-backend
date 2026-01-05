export interface IAuth {
  email: string;
  password: string;
  fcmToken?: string;
}

export interface IParticipantLog {
  name: string;
  fatherName: string;
  motherName: string;
  fcmToken?: string;
}
