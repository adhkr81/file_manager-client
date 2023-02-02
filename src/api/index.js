import axios from "axios";

const appSignup = async(user) => (
    await axios.post('/signup', user)
)

const appLogin = async({email, password}) => ( 
    await axios.post('/login', { email, password })
)

const getHello = async(setter) => {
    const response = await fetch('/api/hello');
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);
    setter(body.express)
    return body;
}




export { getHello, appSignup, appLogin }