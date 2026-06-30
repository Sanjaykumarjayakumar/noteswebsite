"use client";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FiArrowLeft, FiLock, FiMail } from "react-icons/fi";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import useForm from "@/hooks/useForm";
import useAuth from "@/hooks/useAuth";
import usePasswordToggle from "@/hooks/usePasswordToggle";
import { API_BASE_URL } from "@/lib/api";
import { isStrongPassword, passwordRulesMessage } from "@/lib/passwordRules";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Login() {
    const router = useRouter();
    const { formData, handleChange } = useForm({ email: "", password: "" });
    const { showPassword, togglePassword } = usePasswordToggle();
    const checking = useAuth("/home");
    const [googleLoading, setGoogleLoading] = useState(false);
    const [setupUser, setSetupUser] = useState<{
        _id: string;
        name: string;
        email: string;
        token: string;
    } | null>(null);
    const [setupPassword, setSetupPassword] = useState("");
    const [setupLoading, setSetupLoading] = useState(false);
    const [forgotMode, setForgotMode] = useState(false);
    const [resetStep, setResetStep] = useState(1);
    const [resetEmail, setResetEmail] = useState("");
    const [resetOtp, setResetOtp] = useState("");
    const [resetPassword, setResetPassword] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const { email, password } = formData;
        if (!email || !password) {
            toast.error("Please fill all fields");
            return;
        }
        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                email,
                password,
            });
            if (!res.data?._id) {
                toast.error("Invalid credentials");
                return;
            }
            localStorage.setItem("user", JSON.stringify(res.data));
            toast.success("Login Successful");
            router.replace("/home");
        }
        catch (err: unknown) {
            toast.error(axios.isAxiosError(err) ? err.response?.data?.msg || "Login failed" : "Login failed");
        }
    };
    const handleGoogleLogin = async () => {
        if (googleLoading) return;
        setGoogleLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const googleUser = await signInWithPopup(auth, provider);
            if (!googleUser.user.email) {
                await signOut(auth);
                toast.error("Google login failed");
                return;
            }
            const res = await axios.post(`${API_BASE_URL}/api/auth/google`, {
                firebaseUid: googleUser.user.uid,
                name: googleUser.user.displayName || "",
                email: googleUser.user.email,
                provider: "google",
            });
            if (!res.data || !res.data._id) {
                toast.error("Invalid user data received");
                return;
            }
            localStorage.setItem("user", JSON.stringify(res.data));
            if (res.data.needsPasswordSetup) {
                setSetupUser(res.data);
                toast.success("Set a password to continue");
                return;
            }
            router.replace("/home");
        }
        catch (err) {
            toast.error("Google login failed");
            console.log(err);
            if (auth.currentUser) {
                await signOut(auth);
            }
        }
        finally {
            setGoogleLoading(false);
        }
    };

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!setupUser?.token) {
            toast.error("Please login again");
            return;
        }
        if (!isStrongPassword(setupPassword)) {
            toast.error(passwordRulesMessage);
            return;
        }
        setSetupLoading(true);
        try {
            const res = await axios.put(
                `${API_BASE_URL}/api/auth/set-password`,
                { newPassword: setupPassword },
                { headers: { Authorization: `Bearer ${setupUser.token}` } }
            );
            localStorage.setItem("user", JSON.stringify(res.data));
            toast.success("Password set successfully");
            router.replace("/home");
        }
        catch (err: unknown) {
            toast.error(axios.isAxiosError(err) ? err.response?.data?.msg || "Password setup failed" : "Password setup failed");
        }
        finally {
            setSetupLoading(false);
        }
    };

    const sendResetOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetEmail) {
            toast.error("Enter your email");
            return;
        }
        setResetLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/api/auth/forgot-password/send-otp`, {
                email: resetEmail,
            });
            toast.success("OTP sent");
            setResetStep(2);
        }
        catch (err: unknown) {
            toast.error(axios.isAxiosError(err) ? err.response?.data?.msg || "OTP send failed" : "OTP send failed");
        }
        finally {
            setResetLoading(false);
        }
    };

    const verifyResetOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetOtp) {
            toast.error("Enter OTP");
            return;
        }
        setResetLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/api/auth/forgot-password/verify-otp`, {
                email: resetEmail,
                otp: resetOtp,
            });
            toast.success("OTP verified");
            setResetStep(3);
        }
        catch (err: unknown) {
            toast.error(axios.isAxiosError(err) ? err.response?.data?.msg || "OTP verification failed" : "OTP verification failed");
        }
        finally {
            setResetLoading(false);
        }
    };

    const resetUserPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isStrongPassword(resetPassword)) {
            toast.error(passwordRulesMessage);
            return;
        }
        setResetLoading(true);
        try {
            await axios.put(`${API_BASE_URL}/api/auth/forgot-password/reset`, {
                email: resetEmail,
                newPassword: resetPassword,
            });
            toast.success("Password changed. Please sign in.");
            setForgotMode(false);
            setResetStep(1);
            setResetEmail("");
            setResetOtp("");
            setResetPassword("");
        }
        catch (err: unknown) {
            toast.error(axios.isAxiosError(err) ? err.response?.data?.msg || "Password reset failed" : "Password reset failed");
        }
        finally {
            setResetLoading(false);
        }
    };

    if (checking) return null;

    if (setupUser) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#10172B] px-5 py-10 text-white">
                <div className="w-full max-w-[430px] rounded-2xl border border-slate-800 bg-[#111A31] p-8 shadow-2xl">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                        <FiLock size={24} />
                    </div>
                    <h1 className="mt-5 text-2xl font-semibold">Set your password</h1>
                    <p className="mt-2 text-sm text-slate-400">{setupUser.email}</p>
                    <form onSubmit={handleSetPassword} className="mt-6 flex flex-col gap-4">
                        <input
                            type="password"
                            value={setupPassword}
                            placeholder="Create password"
                            onChange={(e) => setSetupPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-700 bg-[#0D1528] p-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                        />
                        <p className="text-xs leading-5 text-slate-400">
                            Minimum 8 characters, 1 capital letter, and 1 special character.
                        </p>
                        <button
                            disabled={setupLoading}
                            className="rounded-xl bg-cyan-400 p-3 font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-60"
                        >
                            {setupLoading ? "Saving..." : "Continue"}
                        </button>
                    </form>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#10172B] px-5 py-10 text-white">
            <section className="w-full max-w-[440px] rounded-2xl border border-slate-800 bg-[#111A31] p-6 shadow-2xl sm:p-8">
                {forgotMode ? (
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                setForgotMode(false);
                                setResetStep(1);
                            }}
                            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                        >
                            <FiArrowLeft />
                            Back to sign in
                        </button>
                        <div className="mb-8">
                            <p className="text-sm font-medium text-cyan-300">Password reset</p>
                            <h1 className="mt-2 text-3xl font-bold">Forgot password</h1>
                        </div>

                        {resetStep === 1 && (
                            <form onSubmit={sendResetOtp} className="space-y-6">
                                <label className="block">
                                    <span className="mb-2 block text-sm text-slate-300">
                                        Email
                                    </span>

                                    <div className="relative">
                                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />

                                        <input
                                            type="email"
                                            value={resetEmail}
                                            placeholder="you@example.com"
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            className="w-full rounded-xl border border-slate-700 bg-[#0D1528] py-3 pl-10 pr-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                                        />
                                    </div>
                                </label>

                                <button
                                    type="submit"
                                    disabled={resetLoading}
                                    className="w-full rounded-xl bg-cyan-400 p-3 font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-60"
                                >
                                    {resetLoading ? "Sending..." : "Send OTP"}
                                </button>
                            </form>
                        )}

                        {resetStep === 2 && (
                            <form onSubmit={verifyResetOtp} className="space-y-5">
                                <div className="rounded-xl border border-slate-800 bg-[#0D1528] p-4 text-sm text-slate-300">
                                    OTP sent to <span className="text-white">{resetEmail}</span>
                                </div>
                                <input
                                    value={resetOtp}
                                    placeholder="Enter OTP"
                                    onChange={(e) => setResetOtp(e.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-[#0D1528] p-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                                />
                                <button
                                    disabled={resetLoading}
                                    className="w-full rounded-xl bg-cyan-400 p-3 font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-60"
                                >
                                    {resetLoading ? "Verifying..." : "Verify OTP"}
                                </button>
                            </form>
                        )}

                        {resetStep === 3 && (
                            <form onSubmit={resetUserPassword} className="space-y-5">
                                <label className="space-y-2">
                                    <span className="text-sm text-slate-300">New password</span>
                                    <div className="relative">
                                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="password"
                                            value={resetPassword}
                                            placeholder="Create new password"
                                            onChange={(e) => setResetPassword(e.target.value)}
                                            className="w-full rounded-xl border border-slate-700 bg-[#0D1528] py-3 pl-10 pr-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                                        />
                                    </div>
                                </label>
                                <p className="text-xs leading-5 text-slate-400">
                                    Minimum 8 characters, 1 capital letter, and 1 special character.
                                </p>
                                <button
                                    disabled={resetLoading}
                                    className="w-full rounded-xl bg-cyan-400 p-3 font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-60"
                                >
                                    {resetLoading ? "Saving..." : "Change password"}
                                </button>
                            </form>
                        )}
                    </>
                ) : (
                    <>
                        <div className="mb-8 text-center">
                            <p className="text-sm font-medium text-cyan-300">Welcome back</p>
                            <h1 className="mt-2 text-3xl font-bold">Sign in</h1>
                        </div>

                        <form onSubmit={handleLogin} className="flex flex-col gap-5">
                            <label className="space-y-2">
                                <span className="text-sm text-slate-300">Email</span>
                                <div className="relative">
                                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        placeholder="you@example.com"
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-700 bg-[#0D1528] py-3 pl-10 pr-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                                    />
                                </div>
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm text-slate-300">Password</span>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        placeholder="Enter password"
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-700 bg-[#0D1528] py-3 pl-10 pr-11 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePassword}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? <FaEye /> : <FaEyeSlash />}
                                    </button>
                                </div>
                            </label>

                            <button
                                type="button"
                                onClick={() => setForgotMode(true)}
                                className="self-end text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
                            >
                                Forgot password?
                            </button>

                            <button className="rounded-xl bg-cyan-400 p-3 font-semibold text-black transition hover:bg-cyan-300">
                                Sign in
                            </button>
                        </form>

                        <div className="my-6 flex items-center gap-3 text-xs uppercase text-slate-500">
                            <span className="h-px flex-1 bg-slate-800" />
                            Or
                            <span className="h-px flex-1 bg-slate-800" />
                        </div>

                        <button
                            disabled={googleLoading}
                            onClick={handleGoogleLogin}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#0D1528] p-3 font-medium text-white transition hover:border-cyan-400 hover:bg-[#14213D] disabled:opacity-60"
                        >
                            <FcGoogle />
                            {googleLoading ? "Connecting..." : "Continue with Google"}
                        </button>

                        <p className="mt-6 text-center text-sm text-slate-400">
                            Do not have an account?
                            <Link href="/register" className="ml-1 font-medium text-cyan-300 hover:text-cyan-200">
                                Create one
                            </Link>
                        </p>
                    </>
                )}
            </section>
        </main>
    );
}
