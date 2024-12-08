export interface User {
    id: string;
    name: string;
    surName: string;
    email: string;
    password: string;
    base: string,
    nationality: string,
    position: string,
    companyName: string,
    age: number,
    sex: string,
    relationshipStatus: string,
    hobbies: string,
    profileImageUrl?: string;
    profileBackgroundUrl?: string;
    profileImageObject?: string;
    profileBackgroundObject?: string;
    licenses: [string],
    licenseType: string,
    experiences: [string],
    flyingHours: number,
    createdAt: Date;
    updatedAt: Date;
  }