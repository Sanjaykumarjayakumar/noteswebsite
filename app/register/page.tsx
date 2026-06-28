"use client";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import useForm from "@/hooks/useForm";
import usePasswordToggle from "@/hooks/usePasswordToggle";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { isStrongPassword, passwordRulesMessage } from "@/lib/passwordRules";
export default function Register() {
    const router = useRouter();
    const { formData, handleChange } = useForm({ name: "", email: "", password: "" });
    const { showPassword, togglePassword, } = usePasswordToggle();
    const checking = useAuth("/home");
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name, email, password } = formData;
        if (!name || !email || !password) {
            toast.error("Fill all fields");
            return;
        }
        if (!isStrongPassword(password)) {
            toast.error(passwordRulesMessage);
            return;
        }
        try {
            const res = await fetch("http://localhost:5000/api/auth/register",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", },
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                        provider: "email",
                    }),
                }
            );
            const data = await res.json();
            if (!res.ok) {
                throw new Error(
                    data.msg
                );
            }
            localStorage.setItem("user", JSON.stringify(data));
            toast.success("User registered successfully");
            router.replace("/home");
        }
        catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "User registration failed");
        }
    };
    if (checking) {
        return null;
    }
    return (
        <main className="flex items-center justify-center h-screen bg-black text-white">
            <div className="w-[340px] p-8 bg-[#111] rounded-2xl">
                <h1 className="text-3xl text-center mb-7">
                    Register
                </h1>
                <form
                    onSubmit={handleRegister}
                    className="flex flex-col gap-4">
                    <input
                        name="name"
                        value={
                            formData.name
                        }
                        placeholder="Name"
                        onChange={handleChange}
                        className="p-3 rounded-2xl bg-[#1a1a1a]"
                    />
                    <input
                        name="email"
                        type="email"
                        value={formData.email}
                        placeholder="Email"
                        onChange={handleChange}
                        className="p-3 rounded-2xl bg-[#1a1a1a]"
                    />
                    <div className="relative">
                        <input
                            name="password"
                            type={showPassword? "text": "password"}
                            value={formData.password}
                            placeholder="Password"
                            onChange={handleChange}
                            className="w-full p-3 rounded-2xl bg-[#1a1a1a]"/>
                        <span
                            onClick={togglePassword}
                            className=" absolute right-3 top-4 cursor-pointer">
                            {showPassword ? <FaEye /> : <FaEyeSlash />}
                        </span>
                    </div>
                    <p className="text-xs leading-5 text-slate-400">
                        Minimum 8 characters, 1 capital letter, and 1 special character.
                    </p>
                    <button className="bg-blue-600 p-3 rounded-2xl">
                        Create Account
                    </button>
                </form>
                <p className="mt-4 text-center">
                    Already have account?
                    <Link
                        href="/login"
                        className="ml-1 text-blue-500"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </main>
    );
}
