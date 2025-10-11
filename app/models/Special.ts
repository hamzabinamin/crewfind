import { GeoPoint } from "firebase/firestore";

export interface Special {
    id: string;
    companyName: string;
    companyImageUrl?: string;
    backgroundImageUrl?: string;
    dealExpiration: string;
    dealDescription: string;
    phoneNumber: string;
    companyCoordinates: GeoPoint;
    dealType: string;
    createdAt: Date;
    updatedAt: Date;
  }

  export default Special;