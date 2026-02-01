import React from 'react'
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const Login = () => {

    const [state, setState] = React.useState("login");
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [otp, setOtp] = React.useState("");
    const [isOtpSent, setIsOtpSent] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const { setShowUserLogin, setUser, axios, navigate } = useAppContext();

    const sendOtp = async () => {
        if (!email) return toast.error("Please enter email");
        setLoading(true);
        try {
            const { data } = await axios.post('/api/user/send-otp', { email });
            if (data.success) {
                toast.success("OTP Sent to " + email);
                setIsOtpSent(true);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        // Login Flow
        if (state === "login") {
            try {
                const { data } = await axios.post('/api/user/login', { email, password });
                if (data.success) {
                    navigate('/');
                    setUser(data.user)
                    setShowUserLogin(false)
                    toast.success("Logged In");
                } else {
                    toast.error(data.message)
                }
            } catch (error) {
                toast.error(error.message)
            }
            return;
        }

        // Register Flow
        if (!isOtpSent) {
            await sendOtp();
        } else {
            // Verify & Register
            try {
                const { data } = await axios.post('/api/user/register', {
                    name, email, password, otp
                });
                if (data.success) {
                    navigate('/');
                    setUser(data.user)
                    setShowUserLogin(false)
                    toast.success("Account Created");
                } else {
                    toast.error(data.message)
                }
            } catch (error) {
                toast.error(error.message)
            }
        }
    }

    return (

        <div onClick={() => setShowUserLogin(false)} className='fixed top-0 bottom-0 left-0 right-0 z-30 flex items-center text-sm text-gray-600 bg-black/50 backdrop-blur-sm'>

            <form onSubmit={onSubmitHandler} onClick={(e) => e.stopPropagation()} className="flex flex-col gap-4 m-auto items-start p-8 py-10 w-80 sm:w-[380px] rounded-xl shadow-2xl border border-gray-100 bg-white animate-in zoom-in-95 duration-200">
                <p className="text-2xl font-bold m-auto text-gray-800">
                    <span className="text-primary">User</span> {state === "login" ? "Login" : "Sign Up"}
                </p>
                {state === "register" && (
                    <div className="w-full">
                        <p className="mb-1 font-medium">Name</p>
                        <input onChange={(e) => setName(e.target.value)} value={name} placeholder="Enter your name" className="border border-gray-300 rounded-lg w-full p-2.5 outline-primary transition-all" type="text" required disabled={isOtpSent} />
                    </div>
                )}
                <div className="w-full">
                    <p className="mb-1 font-medium">Email</p>
                    <input onChange={(e) => setEmail(e.target.value)} value={email} placeholder="Enter your email" className="border border-gray-300 rounded-lg w-full p-2.5 outline-primary transition-all" type="email" required disabled={isOtpSent} />
                </div>
                <div className="w-full">
                    <p className="mb-1 font-medium">Password</p>
                    <input onChange={(e) => setPassword(e.target.value)} value={password} placeholder="Enter your password" className="border border-gray-300 rounded-lg w-full p-2.5 outline-primary transition-all" type="password" required disabled={isOtpSent} />
                </div>

                {state === "register" && isOtpSent && (
                    <div className="w-full animate-in slide-in-from-top-2">
                        <p className="mb-1 font-medium text-primary">Enter OTP</p>
                        <input onChange={(e) => setOtp(e.target.value)} value={otp} placeholder="Check your email for OTP" className="border border-primary rounded-lg w-full p-2.5 outline-none ring-2 ring-primary/20 text-center tracking-widest font-bold text-lg" type="text" maxLength={6} required />
                        <p className="text-xs text-center mt-2 text-gray-400 cursor-pointer hover:text-primary" onClick={() => setIsOtpSent(false)}>Wrong email? Change it</p>
                    </div>
                )}

                {state === "register" ? (
                    <p className="text-sm">
                        Already have account? <span onClick={() => { setState("login"); setIsOtpSent(false); }} className="text-primary font-bold cursor-pointer hover:underline">Login here</span>
                    </p>
                ) : (
                    <p className="text-sm">
                        Create an account? <span onClick={() => setState("register")} className="text-primary font-bold cursor-pointer hover:underline">Register here</span>
                    </p>
                )}
                <button disabled={loading} className="bg-primary hover:bg-primary-dull transition-all text-white font-bold w-full py-2.5 rounded-lg cursor-pointer disabled:opacity-70 disabled:cursor-wait">
                    {loading ? 'Processing...' : state === "register" ? (isOtpSent ? "Verify & Register" : "Verify Email") : "Login"}
                </button>
            </form>
        </div>
    )
}

export default Login