// types/anonymous-chat.ts

export interface BlueMangUser {
  uid: string;
  username: string;
  /** URL-safe slug derived from username, e.g. "apni-duniya" */
  usernameSlug?: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  createdAt: Date | null;
}

export interface AnonymousMessage {
  id: string;
  receiverUid: string;
  receiverUsername: string;
  message: string;
  createdAt: Date | null;
  replied: boolean;
  hidden: boolean;
  reported: boolean;
}

export interface AnonymousMessageInput {
  receiverUid: string;
  receiverUsername: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}