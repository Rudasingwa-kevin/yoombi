export const isStrongPassword = (password: string): boolean => {
    const requirements = getPasswordRequirements(password);
    return requirements.length && requirements.hasUpper && requirements.hasLower && requirements.hasNumber && requirements.hasSpecial;
};

export const getPasswordRequirements = (password: string) => {
    return {
        length: password.length >= 8,
        hasUpper: /[A-Z]/.test(password),
        hasLower: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecial: /[@$!%*?&]/.test(password),
    };
};

export const getPasswordErrorMessage = (): string => {
    return 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.';
};
