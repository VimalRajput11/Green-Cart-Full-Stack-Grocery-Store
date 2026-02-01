import React from 'react';
import { assets } from '../assets/assets';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className='flex flex-col items-center justify-center min-h-[60vh] text-center px-4'>
            <div className='relative mb-8'>
                <img src={assets.leaf_icon} className='w-24 opacity-20 absolute -top-8 -left-12 rotate-[-45deg]' alt="" />
                <h1 className='text-9xl font-bold text-primary opacity-90'>404</h1>
                <img src={assets.leaf_icon} className='w-24 opacity-20 absolute -bottom-8 -right-12 rotate-[45deg]' alt="" />
            </div>

            <h2 className='text-3xl font-bold text-gray-800 mb-4'>Oops! Page Not Found</h2>
            <p className='text-gray-600 mb-8 max-w-md'>
                Looks like you've wandered into an empty aisle. The page you are looking for doesn't exist or has been moved.
            </p>

            <Link to='/' className='bg-primary text-white px-8 py-3 rounded-full font-medium shadow-md hover:bg-primary-dull transition transform hover:-translate-y-1'>
                Back to Home
            </Link>
        </div>
    )
}

export default NotFound;
