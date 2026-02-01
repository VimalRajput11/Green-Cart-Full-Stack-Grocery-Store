import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import toast from 'react-hot-toast';
import axios from 'axios';

const AgentLogin = () => {
  const { isAgent, setIsAgent, navigate } = useAppContext(); // Add these to your context
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (!phone || !password) return toast.error("Phone and password required");

    try {
      const { data } = await axios.post('/api/agents/login', { phone, password });
      if (data.success) {
        setIsAgent(true);
        localStorage.setItem('agentId', data.agent._id); // Store for later use
        toast.success('Logged In');
        navigate('/agents');
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      toast.error(error.message || "Login error");
    }
  };

  useEffect(() => {
    if (isAgent) {
      navigate('/agents');
    }
  }, [isAgent]);

  return !isAgent && (
    <form onSubmit={onSubmitHandler} className='min-h-screen flex items-center text-sm text-gray-600'>
      <div className='flex flex-col gap-5 m-auto items-start p-8 py-12 min-w-80 sm:min-w-88 rounded-lg shadow-xl border border-gray-200'>
        <p className='text-2xl font-medium m-auto'>
          <span className='text-primary'>Agent</span> Login
        </p>

        <div className='w-full'>
          <p>Phone Number</p>
          <input
            onChange={(e) => setPhone(e.target.value)}
            value={phone}
            type='text'
            placeholder='Enter your phone number'
            className='border border-gray-200 rounded w-full p-2 mt-1 outline-primary'
            required
          />
        </div>

        <div className='w-full'>
          <p>Password</p>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type='password'
            placeholder='Enter your password'
            className='border border-gray-200 rounded w-full p-2 mt-1 outline-primary'
            required
          />
        </div>

        <button className='bg-primary text-white w-full py-2 rounded-md cursor-pointer'>Login</button>
      </div>
    </form>
  );
};

export default AgentLogin;
