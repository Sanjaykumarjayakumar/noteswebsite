import { useState } from "react";
export default function useForm<T>(initialData: T) {
    const [formData, setFormData] = useState<T>(initialData);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    return { formData, setFormData, handleChange };
}