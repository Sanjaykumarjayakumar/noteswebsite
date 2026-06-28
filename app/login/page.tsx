"use client";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import useForm from "@/hooks/useForm";
import useAuth from "@/hooks/useAuth";
import usePasswordToggle from "@/hooks/usePasswordToggle";
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
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const { email, password } = formData;
        if (!email || !password) {
            toast.error("Please fill all fields");
            return;
        }
        try {
            const res =
                await axios.post("http://localhost:5000/api/auth/login", {
                    email,
                    password
                }
                );
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
        if (googleLoading) {
            return;
        }
        setGoogleLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const googleUser = await signInWithPopup(auth, provider);
            if (!googleUser.user.email) {
                await signOut(auth);
                toast.error("Google login failed");
                return;
            }
            const res = await axios.post("http://localhost:5000/api/auth/google", {
                firebaseUid: googleUser.user.uid,
                name: googleUser.user.displayName || "",
                email: googleUser.user.email,
                provider: "google",
            });
            if (!res.data || !res.data._id) {
                alert("Error: Invalid user data received");
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
    }
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
                "http://localhost:5000/api/auth/set-password",
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
    if (checking)
        return null;
    if (setupUser) {
        return (
            <main className="flex items-center justify-center h-screen bg-[#10172B] px-5 text-white">
                <div className="w-full max-w-[380px] rounded-2xl border border-slate-800 bg-[#16213E] p-8 shadow-2xl">
                    <h1 className="text-2xl font-semibold">Set your password</h1>
                    <p className="mt-2 text-sm text-slate-400">
                        {setupUser.email}
                    </p>
                    <form onSubmit={handleSetPassword} className="mt-6 flex flex-col gap-4">
                        <input
                            type="password"
                            value={setupPassword}
                            placeholder="Create password"
                            onChange={(e) => setSetupPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-700 bg-[#0E1733] p-3 text-white outline-none focus:border-cyan-400"
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
        <main className="flex items-center justify-center h-screen bg-black text-white">
            <div className="w-[340px] p-8 rounded-2xl bg-[#111]">
                <h1 className="text-3xl text-center mb-7">
                    Login
                </h1>
                <form
                    onSubmit={handleLogin}
                    className="flex flex-col gap-4"
                >
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        placeholder="Email"
                        onChange={handleChange}
                        className="p-3 rounded-2xl bg-[#1a1a1a]"
                    />
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            placeholder="Password"
                            onChange={handleChange}
                            className="w-full p-3 rounded-2xl bg-[#1a1a1a]" />
                        <span onClick={togglePassword} className=" absolute right-3 top-4 cursor-pointer ">
                            {showPassword ? <FaEye />
                                : <FaEyeSlash />}
                        </span>
                    </div>
                    <button className=" bg-blue-600 p-3 rounded-3xl ">
                        Login
                    </button>
                </form>
                <div className="flex items-center gap-2 my-4">
                    <hr className="flex-1" />
                    OR
                    <hr className="flex-1" />
                </div>
                <button
                    disabled={googleLoading}
                    onClick={handleGoogleLogin}
                    className="w-full p-3 rounded-3xl flex items-center justify-center gap-2 bg-[#1a1a1a] " >
                    <FcGoogle />
                    Continue with Google
                </button>
                <p className="mt-4 text-center">
                    Don't have account?
                    <Link
                        href="/register"
                        className="ml-1 text-blue-500"
                    >
                        Register
                    </Link>
                </p>
            </div>
        </main>
    );
}
