export const passwordRulesMessage =
    "Password must be at least 8 characters with 1 capital letter and 1 special character";

export const isStrongPassword = (password: string) =>
    password.length >= 8 && /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password);
