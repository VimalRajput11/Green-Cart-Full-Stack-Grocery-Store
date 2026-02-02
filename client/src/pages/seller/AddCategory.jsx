import React, { useState } from 'react'
import { assets } from '../../assets/assets';
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast';

const AddCategory = () => {

    const [image, setImage] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const { axios, getCategories, categories, confirmAction } = useAppContext();

    // Helper to resize image on client side
    const resizeImage = (file, maxWidth = 500) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const scale = maxWidth / img.width;
                    if (scale < 1) {
                        canvas.width = maxWidth;
                        canvas.height = img.height * scale;
                    } else {
                        canvas.width = img.width;
                        canvas.height = img.height;
                    }
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/webp' }));
                    }, 'image/webp', 0.8);
                };
            };
        });
    };

    const onSubmitHandler = async (event) => {
        try {
            event.preventDefault();
            setLoading(true);

            if (!image) {
                setLoading(false);
                return toast.error("Category image is required");
            }

            const optimizedImage = await resizeImage(image);

            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('image', optimizedImage);

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
        } finally {
            setLoading(false);
        }
    }

    const deleteCategoryHandler = async (id) => {
        confirmAction(
            "Delete Category",
            "Are you sure you want to delete this category? This action cannot be undone.",
            async () => {
                try {
                    const { data } = await axios.post('/api/category/delete', { id });
                    if (data.success) {
                        toast.success(data.message);
                        if (getCategories) getCategories();
                    } else {
                        toast.error(data.message);
                    }
                } catch (error) {
                    toast.error(error.message);
                }
            }
        );
    }

    return (
        <div className="p-8 bg-[#fcfcfc] min-h-screen no-scrollbar overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight tracking-[-0.04em]">Category Protocol</h1>
                    <p className="text-gray-400 font-semibold mt-1 text-sm">Define and organize your market segments.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Add Category Form */}
                    <div className="flex-1 lg:max-w-md">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100/60 shadow-sm space-y-8">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Create Record</h3>

                            <form onSubmit={onSubmitHandler} className="space-y-8">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 pl-1">Media Identity</p>
                                    <label htmlFor="category-image" className="cursor-pointer group block w-full aspect-[16/10] rounded-2xl border-2 border-dashed border-gray-100 hover:border-green-300 hover:bg-green-50/20 transition-all overflow-hidden flex items-center justify-center p-3 relative">
                                        {image ? (
                                            <div className="relative w-full h-full">
                                                <img className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" src={URL.createObjectURL(image)} alt="" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                                    <span className="text-white text-[10px] font-bold uppercase tracking-widest">Update Source</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 opacity-20 group-hover:opacity-60 group-hover:scale-110 transition-all">
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Select Asset</span>
                                            </div>
                                        )}
                                        <input onChange={(e) => setImage(e.target.files[0])} type="file" id="category-image" hidden />
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1" htmlFor="category-name">Market Designation</label>
                                    <input onChange={(e) => setName(e.target.value)} value={name}
                                        id="category-name" type="text" placeholder="e.g. Exotic Fruits" className="w-full bg-gray-50/30 border border-gray-100 px-6 py-5 rounded-2xl outline-none focus:ring-8 focus:ring-green-500/5 focus:bg-white focus:border-green-500/30 transition-all font-semibold text-gray-900 placeholder:text-gray-300" required />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1" htmlFor="category-desc">Inventory Brief</label>
                                    <textarea onChange={(e) => setDescription(e.target.value)} value={description}
                                        id="category-desc" rows={4} className="w-full bg-gray-50/30 border border-gray-100 px-6 py-5 rounded-2xl outline-none focus:ring-8 focus:ring-green-500/5 focus:bg-white focus:border-green-500/30 transition-all font-semibold text-gray-700 resize-none leading-relaxed placeholder:text-gray-300"
                                        placeholder="Define the scope of this inventory group..."></textarea>
                                </div>

                                <button disabled={loading} className={`w-full py-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-green-500/20 active:scale-[0.98] uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                            Initialize Category
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Categories List */}
                    <div className="flex-1">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100/60 shadow-sm h-full flex flex-col">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Active Matrix</h2>
                                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">Operational store segments</p>
                                </div>
                                <span className="bg-green-50 text-green-600 text-[10px] font-bold px-4 py-1.5 rounded-full border border-green-100/50 shadow-sm uppercase tracking-widest">
                                    {categories?.length || 0} SECTORS
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar pb-10">
                                {categories && categories.length > 0 ? categories.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-3xl border border-gray-50 group transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-gray-100 hover:border-gray-200 hover:-translate-y-1">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-[1.25rem] bg-white border border-gray-100 overflow-hidden p-2 flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                                <img src={item.image} alt="" className="w-full h-full object-contain" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 text-base leading-tight mb-1 group-hover:text-green-600 transition-colors uppercase tracking-tight">{item.name}</p>
                                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest line-clamp-1">{item.description || 'No Protocol'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteCategoryHandler(item._id)}
                                            className="w-11 h-11 rounded-[1.25rem] flex items-center justify-center text-gray-300 hover:text-white hover:bg-red-500 hover:border-red-600 transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-transparent"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" /></svg>
                                        </button>
                                    </div>
                                )) : (
                                    <div className="col-span-full text-center py-32 opacity-10">
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                                        <p className="font-bold text-lg uppercase tracking-[0.2em]">Matrix Empty</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddCategory;
