import { Airline } from "./Airline";

export interface JobPost {
    id: string;
    title: string;
    base: string;
    jobFor?: string;
    jobExpiration: string;
    description: string;
    jobURL: string;
    airline: Airline;
    createdAt: Date;
    updatedAt: Date;
  }

  export default JobPost;