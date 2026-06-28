"use client";

import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
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

export default function Register() {
const router = useRouter();

const checking = useAuth("/home");

const { formData, handleChange } = useForm({
name: "",
email: "",
password: "",
otp: "",
});

const { showPassword, togglePassword } =
usePasswordToggle();

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
const res = await fetch(
"http://localhost:5000/api/auth/send-otp",
{
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
email: formData.email,
}),
}
);

const data = await res.json();

if (!res.ok)
throw new Error(data.msg);

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
const res = await fetch(
"http://localhost:5000/api/auth/verify-otp",
{
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
email: formData.email,
otp: formData.otp,
}),
}
);

const data = await res.json();

if (!res.ok)
throw new Error(data.msg);

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
const res = await fetch(
"http://localhost:5000/api/auth/register",
{
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
}
);

const data = await res.json();

if (!res.ok)
throw new Error(data.msg);

localStorage.setItem(
"user",
JSON.stringify(data)
);

toast.success("Account created");

router.replace("/home");

} catch (err: any) {
toast.error(err.message);
}

setLoading(false);
}

return (
<main className="min-h-screen flex justify-center items-center bg-black text-white">

<div className="w-[360px] bg-[#111] p-8 rounded-3xl">

<h1 className="text-center text-3xl mb-8">
Register
</h1>

<div className="flex justify-center mb-8 gap-2">

<div className={`h-2 w-20 rounded ${
step>=1
?
"bg-blue-500"
:
"bg-gray-700"
}`}/>

<div className={`h-2 w-20 rounded ${
step>=2
?
"bg-blue-500"
:
"bg-gray-700"
}`}/>

<div className={`h-2 w-20 rounded ${
step>=3
?
"bg-blue-500"
:
"bg-gray-700"
}`}/>

</div>

{step===1 && (
<div className="space-y-4">

<input
name="name"
value={formData.name}
onChange={handleChange}
placeholder="Name"
className="w-full p-3 rounded-2xl bg-[#1a1a1a]"
/>

<input
name="email"
type="email"
value={formData.email}
onChange={handleChange}
placeholder="Email"
className="w-full p-3 rounded-2xl bg-[#1a1a1a]"
/>

<button
onClick={sendOtp}
disabled={loading}
className="w-full bg-blue-600 p-3 rounded-2xl"
>

Continue

</button>

</div>
)}

{step===2 && (
<div className="space-y-4">

<input
name="otp"
value={formData.otp}
onChange={handleChange}
placeholder="Enter OTP"
className="w-full p-3 rounded-2xl bg-[#1a1a1a]"
/>

<button
onClick={verifyOtp}
className="w-full bg-green-600 p-3 rounded-2xl"
>

Verify OTP

</button>

</div>
)}

{step===3 && (
<div className="space-y-4">

<div className="relative">

<input
name="password"
type={
showPassword
?
"text"
:
"password"
}
value={formData.password}
onChange={handleChange}
placeholder="Password"
className="w-full p-3 rounded-2xl bg-[#1a1a1a]"
/>

<span
onClick={togglePassword}
className="absolute right-4 top-4 cursor-pointer"
>

{
showPassword
?
<FaEye/>
:
<FaEyeSlash/>
}

</span>

</div>

<p className="text-xs text-gray-400">
Minimum 8 chars, 1 capital, 1 special
</p>

<button
onClick={register}
className="w-full bg-blue-600 p-3 rounded-2xl"
>

Sign Up

</button>

</div>
)}

<p className="text-center mt-6">

Already have account?

<Link
href="/login"
className="ml-2 text-blue-500"
>

Login

</Link>

</p>

</div>

</main>
);
}