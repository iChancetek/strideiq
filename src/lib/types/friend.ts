export type FriendStatus = "pending" | "accepted" | "declined" | "blocked";

export interface FriendRequest {
    id: string;
    requesterId: string;
    receiverId: string;
    status: FriendStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface FriendProfile {
    uid: string;
    displayName: string;
    photoURL?: string;
    stats?: {
        totalMiles: number;
        totalRuns: number;
    };
}
