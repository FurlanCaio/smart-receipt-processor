export interface UserDocument {
    email: string;
    password: string;
    name: string | null;
    company: string | null;
    isDeleted: boolean;
    phoneNumber: string | null;
    profilePictureUrl: string | null;
    openAiApiKey: string | null;
    openAiApiKeyIv: string | null;
    openAiPreferenceModel: string | null;
    openAiPreferenceTemperature: number | null;
    refreshTokenHash: string | null;
}

