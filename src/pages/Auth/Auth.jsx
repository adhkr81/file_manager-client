import { Button, TextInput } from "@mantine/core"
import {useState} from "react"
import { useNavigate } from "react-router-dom"
import {appSignup, appLogin} from "../../api"

export default function Auth({setUser, setFolders}) {
    const [formState, setFormState] = useState("login")
    return (
        <div className="flex justify-center items-center flex-col h-full">
            {formState === "login" ? 
                <Login setState={setFormState} setUser={setUser} setFolders={setFolders}/>
            :
            <div className="flex justify-center items-center flex-col">
                <Register setState={setFormState} />
            </div>
            }
        </div>
    )
}

const Login = ({setState, setUser, setFolders}) => {
    const navigate = useNavigate();
    const handleSubmit = async e => {
        e.preventDefault();
        const email = e.target.elements.email.value
        const password = e.target.elements.password.value
        const response = await appLogin({email, password});
        if(response.data.token){
            window.localStorage.setItem("devtoken", response.data.token)
            setUser(response.data.user)
            setFolders(response.data.folders)
            navigate("/gallery");

            console.log(response.data)
        } else {
            alert("Login failed.")
        }
    }
    return(
        <div className="flex justify-center items-center flex-col w-64 h-48">
        <form onSubmit={handleSubmit} className="flex justify-center items-center flex-col w-full">
            <h1 className="mt-0 my-2">Login</h1>
            <TextInput name="email" placeholder="Email" type="text" className="mb-2 w-full"/>
            <TextInput name="password" placeholder="Password" type="password" className="mb-2 w-full"/>
            <div className="flex flex-row justify-between w-full">
                <Button variant="light" onClick={()=>setState("register")}>Sign up</Button>
                <Button type="submit">Login</Button>
            </div>
        </form>
    </div>
    )
}


const Register = ({setState}) => {
    const handleSubmit = async(e) => {
        e.preventDefault();
        try {
            const password = e.target.elements.password.value
            const confirmpassword = e.target.elements.confirmPassword.value
            if(password !== confirmpassword){ return alert("Passwords must match") }
            const email = e.target.elements.email.value
            const company = e.target.elements.company.value, branch = "", role = "admin", settings = {}, firstname = e.target.elements.firstname.value, lastname = e.target.elements.lastname.value;
            const response = await appSignup({
                email, firstname, lastname, company, branch, role, settings, password
            })
            console.log(response);
            if(response){
                alert("Thank you for signing up. Please login!")
                return setState("login")
            } else {
                alert("Signup failed")
            }
            } catch(err) { return alert("Please fill in all fields.") }
    }
    return(
        <div className="flex justify-center items-center flex-col w-64 h-48">
        <form onSubmit={handleSubmit} className="flex justify-center items-center flex-col w-full">
            <h1 className="mt-0 my-2">Sign Up</h1>
            <div className="w-full flex flex-row items-center">
                <label className="text-xs mr-2">Company</label>
                <select label="Company" name="company" value="company1" className="mb-2 p-1 pr-5">
                    <option value="company1" label="company1"></option>
                    <option value="company2" label="company2"></option>
                </select>
            </div>
            <TextInput name="email" placeholder="Email" type="text" className="mb-2 w-full"/>
            <TextInput name="firstname" placeholder="First name" type="text" className="mb-2 w-full"/>
            <TextInput name="lastname" placeholder="Last name" type="text" className="mb-2 w-full"/>
            <TextInput name="password" placeholder="Password" type="password" className="mb-2 w-full"/>
            <TextInput name="confirmPassword" placeholder="Confirm Password" type="password" className="mb-2 w-full"/>
            <div className="flex flex-row justify-between w-full">
                <Button variant="light" onClick={()=>setState("login")}>Login</Button>
                <Button type="submit">Submit</Button>
            </div>
        </form>
    </div>
    )
}
