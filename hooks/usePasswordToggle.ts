import { useState } from "react";
export default function usePasswordToggle(){
    const [showPassword,setshowPassword] = useState(false);
    const togglePassword = ()=>{
        setshowPassword(!showPassword);
    };
    return {showPassword,togglePassword};
}