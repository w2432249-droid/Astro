import { Timestamp } from "firebase/firestore";

export interface Wishlist {
  id: string;
  title: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  createdAt: Timestamp;
}

export interface Gift {
  id: string;
  name: string;
  price?: number;
  imageUrl?: string;
  status: 'available' | 'claimed';
  claimedBy?: string;
  claimedAt?: Timestamp;
  createdAt: Timestamp;
  order: number;
}
