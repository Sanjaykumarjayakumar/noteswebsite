type PasswordChecklistProps = {
    password: string;
};

export const getPasswordChecks = (password: string) => [
    { label: "Minimum 8 characters", valid: password.length >= 8 },
    { label: "1 capital letter", valid: /[A-Z]/.test(password) },
    { label: "1 special character", valid: /[^A-Za-z0-9]/.test(password) },
];

export default function PasswordChecklist({ password }: PasswordChecklistProps) {
    return (
        <div className="space-y-1 text-xs leading-5">
            {getPasswordChecks(password).map((check) => (
                <p key={check.label} className={check.valid ? "text-green-400" : "text-slate-500"}>
                    {check.label}
                </p>
            ))}
        </div>
    );
}
