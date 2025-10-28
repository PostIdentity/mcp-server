export interface Identity {
    id: string;
    name: string;
    bio: string;
    created_at: string;
}
export interface GeneratePostResult {
    success: boolean;
    generatedPost?: string;
    remainingCredits?: number;
    error?: string;
}
export interface Credits {
    credits: number;
}
//# sourceMappingURL=types.d.ts.map