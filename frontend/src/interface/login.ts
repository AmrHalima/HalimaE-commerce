export interface SuccessfulLoginResponse {
    message: string;
    token: string;
    user: UserResponse;
}
export interface FailedLoginResponse {
    statusMsg: string;
    message: string;
}
export interface UserResponse {
    name: string;
    email: string;
    role: string;
}
