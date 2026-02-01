import React, { useState } from 'react'
import { assets } from '../../assets/assets';
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast';

const AddCategory = () => {

    const [image, setImage] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const { axios, getCategories } = useAppContext();

    const onSubmitHandler = async (event) => {
        try {
            event.preventDefault();

            if (!image) {
                return toast.error("Category image is required");
            }

            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('image', image);

            const { data } = await axios.post('/api/category/add', formData);

            if (data.success) {
                toast.success(data.message);
                setName('');
                setDescription('');
                setImage(false);
                // Refresh categories in context if the function is available
                if (getCategories) getCategories();
            }
            else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    return (
        <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll flex flex-col justify-between">
            <form onSubmit={onSubmitHandler} className="md:p-10 p-4 space-y-5 max-w-lg">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Add New Category</h1>

                <div>
                    <p className="text-base font-medium">Category Image</p>
                    <label htmlFor="category-image" className="cursor-pointer mt-2 block">
                        <img className="max-w-32 rounded-lg border border-gray-200 shadow-sm" src={image ? URL.createObjectURL(image) : assets.upload_area} alt="" />
                        <input onChange={(e) => setImage(e.target.files[0])} type="file" id="category-image" hidden />
                    </label>
                </div>

                <div className="flex flex-col gap-1 max-w-md">
                    <label className="text-base font-medium" htmlFor="category-name">Category Name</label>
                    <input onChange={(e) => setName(e.target.value)} value={name}
                        id="category-name" type="text" placeholder="e.g. Vegetables" className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40" required />
                </div>

                <div className="flex flex-col gap-1 max-w-md">
                    <label className="text-base font-medium" htmlFor="category-desc">Description (Optional)</label>
                    <textarea onChange={(e) => setDescription(e.target.value)} value={description}
                        id="category-desc" rows={3} className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none"
                        placeholder="Short description..."></textarea>
                </div>

                <button className="px-8 py-2.5 bg-primary text-white font-medium rounded cursor-pointer hover:bg-primary-dull transition">Create Category</button>

            </form>
        </div>
    )
}

export default AddCategory;
