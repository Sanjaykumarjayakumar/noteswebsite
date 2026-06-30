"use client";

import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FiCheck, FiLock, FiMail, FiUser } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

import useForm from "@/hooks/useForm";
import usePasswordToggle from "@/hooks/usePasswordToggle";
import useAuth from "@/hooks/useAuth";
import {
    isStrongPassword,
    passwordRulesMessage,
} from "@/lib/passwordRules";

const steps = ["Details", "Verify", "Password"];

export default function Register() {
    const router = useRouter();
    const checking = useAuth("/home");
    const { formData, handleChange } = useForm({
        name: "",
        email: "",
        password: "",
        otp: "",
    });
    const { showPassword, togglePassword } = usePasswordToggle();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    if (checking) return null;

    async function sendOtp() {
        if (!formData.name || !formData.email) {
            toast.error("Enter name and email");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("http://localhost:5000/api/auth/send-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.msg);

            toast.success("OTP sent");
            setStep(2);
        } catch (err: any) {
            toast.error(err.message);
        }

        setLoading(false);
    }

    async function verifyOtp() {
        if (!formData.otp) {
            toast.error("Enter OTP");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    otp: formData.otp,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.msg);

            toast.success("OTP verified");
            setStep(3);
        } catch (err: any) {
            toast.error(err.message);
        }

        setLoading(false);
    }

    async function register() {
        if (!isStrongPassword(formData.password)) {
            toast.error(passwordRulesMessage);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    provider: "email",
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.msg);

            localStorage.setItem("user", JSON.stringify(data));
            toast.success("Account created");
            router.replace("/home");
        } catch (err: any) {
            toast.error(err.message);
        }

        setLoading(false);
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#10172B] px-5 py-10 text-white">
            <section className="w-full max-w-[460px] rounded-2xl border border-slate-800 bg-[#111A31] p-6 shadow-2xl sm:p-8">
                <div className="p-6 sm:p-8">
                    <div className="mb-8 text-center">
                        <p className="text-sm font-medium text-cyan-300">Start writing</p>
                        <h1 className="mt-2 text-3xl font-bold">Create account</h1>
                    </div>

                    <div className="mb-8 grid grid-cols-3 gap-2">
                        {steps.map((label, index) => {
                            const currentStep = index + 1;
                            const complete = step > currentStep;
                            const active = step === currentStep;
                            return (
                                <div
                                    key={label}
                                    className={`rounded-xl border p-3 text-center text-xs font-medium transition ${
                                        active || complete
                                            ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200"
                                            : "border-slate-800 bg-[#0D1528] text-slate-500"
                                    }`}
                                >
                                    <div className="mx-auto mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#10172B]">
                                        {complete ? <FiCheck /> : currentStep}
                                    </div>
                                    {label}
                                </div>
                            );
                        })}
                    </div>

                    {step === 1 && (
                        <div className="space-y-5">
                            <label className="space-y-2">
                                <span className="text-sm text-slate-300">Name</span>
                                <div className="relative">
                                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Your name"
                                        className="w-full rounded-xl border border-slate-700 bg-[#0D1528] py-3 pl-10 pr-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                                    />
                                </div>
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm text-slate-300">Email</span>
                                <div className="relative">
                                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className="w-full rounded-xl border border-slate-700 bg-[#0D1528] py-3 pl-10 pr-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                                    />
                                </div>
                            </label>

                            <button
                                onClick={sendOtp}
                                disabled={loading}
                                className="mt-2 w-full rounded-xl bg-cyan-400 p-3 font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-60"
                            >
                                {loading ? "Sending..." : "Send OTP"}
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5">
                            <div className="rounded-xl border border-slate-800 bg-[#0D1528] p-4 text-sm text-slate-300">
                                OTP sent to <span className="text-white">{formData.email}</span>
                            </div>

                            <input
                                name="otp"
                                value={formData.otp}
                                onChange={handleChange}
                                placeholder="Enter OTP"
                                className="w-full rounded-xl border border-slate-700 bg-[#0D1528] p-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                            />

                            <button
                                onClick={verifyOtp}
                                disabled={loading}
                                className="mt-2 w-full rounded-xl bg-cyan-400 p-3 font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-60"
                            >
                                {loading ? "Verifying..." : "Verify OTP"}
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-5">
                            <label className="space-y-2">
                                <span className="text-sm text-slate-300">Password</span>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Create password"
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

                            <p className="rounded-xl border border-slate-800 bg-[#0D1528] p-3 text-xs leading-5 text-slate-400">
                                Minimum 8 characters, 1 capital letter, and 1 special character.
                            </p>

                            <button
                                onClick={register}
                                disabled={loading}
                                className="mt-2 w-full rounded-xl bg-cyan-400 p-3 font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-60"
                            >
                                {loading ? "Creating..." : "Create account"}
                            </button>
                        </div>
                    )}

                    <p className="mt-6 text-center text-sm text-slate-400">
                        Already have an account?
                        <Link href="/login" className="ml-1 font-medium text-cyan-300 hover:text-cyan-200">
                            Sign in
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
