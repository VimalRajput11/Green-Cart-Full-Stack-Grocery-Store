import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const InputField = ({type, placeholder, name, handleChange, address})=>(
    <input className='w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-white
    text-gray-800 placeholder:text-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10 transition'
    required
    aria-label={placeholder}
    type={type} 
    placeholder={placeholder}
    onChange={handleChange}
    name={name}
    value={address[name]}
    required
    />
)

const AddAddress = () =>{

  const {axios, user, navigate, authChecked, setShowUserLogin} = useAppContext();

    const [address, setAddress] = useState({
      firstName: '',
      lastName: '',
      email: '',
      street: '',
      city: '',
      state: '',
      zipcode: '',
      country: '',
      phone: '',
    })

    const handleChange = (e) =>{
      const {name, value} = e.target;

      setAddress((prevAddress) =>({
        ...prevAddress,
        [name]: value,
      }))
    }

      const onSubmitHandler = async(e) =>{
        e.preventDefault();
        try {
          const {data} = await axios.post('/api/address/add', {
            userId: user._id,
            address,
          });

          if(data.success){
            toast.success(data.message);
            navigate('/cart')
          }
          else{
            toast.error(data.message)
          }
        } catch (error) {
          toast.error(error.message);
        }
      }

      // Only redirect once we actually know the visitor isn't logged in
      useEffect(() =>{
        if(authChecked && !user){
          setShowUserLogin(true)
          navigate('/cart')
        }
      },[authChecked, user])

  return (
    <div className='mt-8 md:mt-12 pb-16'>
          <div className='flex flex-col md:flex-row justify-between items-center gap-10'>
            <div className='flex-1 w-full max-w-lg bg-white border border-gray-100 rounded-3xl shadow-sm p-6 md:p-8'>
              <h1 className='text-2xl font-bold text-gray-900'>Add delivery address</h1>
              <p className='text-sm text-gray-500 mt-1'>Your delivery partner will use this to reach you.</p>
              <form onSubmit={onSubmitHandler} className='space-y-3 mt-6 text-sm'>
                  <div className='grid grid-cols-2 gap-4'>
                    <InputField handleChange={handleChange} address={address} name='firstName'
                    type='text' placeholder='First Name'/>
                    <InputField handleChange={handleChange} address={address} name='lastName' 
                    type='text' placeholder='Last Name' />
                  </div>

                  <InputField handleChange={handleChange} address={address} name='email'
                  type='email' placeholder='Email address'/>
                  <InputField handleChange={handleChange} address={address} name='street'
                  type='text' placeholder='House / flat no., building, street, area'/>

                  <div className='grid grid-cols-2 gap-4'>
                  <InputField handleChange={handleChange} address={address} name='city'
                  type='text' placeholder='City'/>
                  <InputField handleChange={handleChange} address={address} name='state'
                  type='text' placeholder='State'/>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                  <InputField handleChange={handleChange} address={address} name='zipcode'
                  type='number' placeholder='PIN code'/>
                  <InputField handleChange={handleChange} address={address} name='country'
                  type='text' placeholder='Country'/>
                  </div>

                  <InputField handleChange={handleChange} address={address} name='phone'
                  type='tel' placeholder='Phone number (for delivery updates)'/>

                  <button className='w-full mt-4 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-dull
                  transition cursor-pointer'>
                    Save address
                  </button>

              </form>
            </div>
            <img className='hidden md:block w-full max-w-sm md:mr-8' src={assets.add_address_iamge} alt='' />
          </div>
    </div>
  )
}

export default AddAddress