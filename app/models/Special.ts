type Coordinates = {
  latitude: number;
  longitude: number;
};

export interface Special {
    id: string;
    companyName: string;
    companyImageUrl?: string;
    backgroundImageUrl?: string;
    dealExpiration: string;
    dealType: string;
    location: Coordinates;
    createdAt: Date;
    updatedAt: Date;
  }

  export default Special;