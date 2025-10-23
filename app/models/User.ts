import { GeoPoint } from "firebase/firestore";

export interface User {
    id?: string;
    name: string;
    surName: string;
    email: string;
    password?: string;
    isVerified: string;
    base: string,
    nationality: string,
    position: string,
    companyName: string,
    age: number,
    sex: string,
    relationshipStatus: string,
    hobbies: string[],
    profileImage?: string;
    backgroundImage?: string;
    profileImageObject?: string;
    backgroundImageObject?: string;
    licenses: string[],
    licenseType: string,
    experiences: string[],
    friends: string[],
    blocked: string[],
    flyingHoursPIC: number,
    flyingHoursTotal: number,
    yearsOfExperience: number,
    userCoordinates: GeoPoint;
    lastSeen: Date,
    createdAt: Date;
    updatedAt: Date;
  }

  export function createUser(): User {
    return {
      id: "",
      name: "",
      surName: "",
      email: "",
      password: "",
      isVerified: "",
      base: "",
      nationality: "",
      position: "",
      companyName: "",
      age: 0,
      sex: "",
      relationshipStatus: "",
      hobbies: [],
      licenses: [],
      licenseType: "",
      experiences: [],
      friends: [],
      blocked: [],
      flyingHoursPIC: 0,
      flyingHoursTotal: 0,
      yearsOfExperience: 0,
      userCoordinates: new GeoPoint(0, 0),
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      profileImage: undefined,
      backgroundImage: undefined,
      profileImageObject: undefined,
      backgroundImageObject: undefined,
    };
  }

  export default User;