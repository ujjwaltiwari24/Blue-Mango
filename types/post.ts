export interface Post {
  id: string;

  text: string;

  mood: string;

  category: string;

  anonymousName: string;

  createdAt?: any;

  userId: string;
}