import React, { useState } from 'react'
import { assets } from '../../assets/assets';
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {

    const [files, setFiles] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [offerPrice, setOfferPrice] = useState('');
    const [weight, setWeight] = useState('');
    const [stock, setStock] = useState('');
    const [loading, setLoading] = useState(false);

    const { axios, categories } = useAppContext();
    const navigate = useNavigate();

    // Helper to resize image on client side
    const resizeImage = (file, maxWidth = 800) => {
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

            const productData = {
                name,
                description: description.split('\n').filter(desc => desc.trim() !== ''),
                category,
                price,
                offerPrice,
                weight,
                stock: stock || 0
            }

            const formData = new FormData();
            formData.append('productData', JSON.stringify(productData));

            // Compress and append all selected images
            for (let i = 0; i < files.length; i++) {
                if (files[i]) {
                    const optimizedFile = await resizeImage(files[i]);
                    formData.append('images', optimizedFile);
                }
            }

            const { data } = await axios.post('/api/product/add', formData)

            if (data.success) {
                toast.success(data.message);
                setName('')
                setDescription('')
                setCategory('')
                setPrice('')
                setOfferPrice('')
                setWeight('')
                setStock('')
                setFiles([])
                navigate('/seller/product-list')
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

    return (
        <div className="p-8 bg-[#fcfcfc] min-h-screen no-scrollbar overflow-y-auto">
            <div className="max-w-4xl">
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight tracking-[-0.04em]">Add New Product</h1>
                    <p className="text-gray-400 font-semibold mt-1 text-sm">Expand your digital catalog with new inventory.</p>
                </div>

                <form onSubmit={onSubmitHandler} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Left Column - Images */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100/60 shadow-sm flex flex-col gap-8">
                        <div>
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Product Visualization</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {Array(4).fill('').map((_, index) => (
                                    <label key={index} htmlFor={`image${index}`} className="group cursor-pointer">
                                        <input onChange={(e) => {
                                            const updatedFiles = [...files];
                                            updatedFiles[index] = e.target.files[0];
                                            setFiles(updatedFiles)
                                        }}
                                            type="file" id={`image${index}`} hidden />
                                        <div className="aspect-square w-full border-2 border-dashed border-gray-100 rounded-[1.5rem] p-4 bg-gray-50/50 flex items-center justify-center group-hover:bg-green-50 group-hover:border-green-200 transition-all duration-300 relative overflow-hidden overflow-hidden">
                                            <img className={`max-w-full max-h-full object-contain ${files[index] ? 'scale-100' : 'opacity-20 grayscale'}`}
                                                src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area}
                                                alt="uploadArea" />
                                            {!files[index] && (
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-green-600/10">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M12 5v14M5 12h14" /></svg>
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider mt-6 text-center">Supported formats: WEBP, PNG, JPG (Max 5MB)</p>
                        </div>

                        <div className="mt-auto">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-3 block">Full Description</label>
                            <textarea onChange={(e) => setDescription(e.target.value)} value={description}
                                id="product-description" rows={6} className="w-full outline-none py-5 px-6 rounded-2xl border border-gray-100 focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 transition-all resize-none text-sm font-semibold bg-gray-50/30 placeholder:text-gray-300"
                                placeholder="Detail the features, benefits, and origin of the product..."></textarea>
                        </div>
                    </div>

                    {/* Right Column - Attributes */}
                    <div className="flex flex-col gap-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100/60 shadow-sm space-y-8">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Core Attributes</h3>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1" htmlFor="product-name">Product Name</label>
                                <input onChange={(e) => setName(e.target.value)} value={name}
                                    id="product-name" type="text" placeholder="e.g. Organic Alphonso Mango" className="w-full bg-gray-50/50 outline-none py-5 px-6 rounded-2xl border border-gray-100 focus:border-green-500/50 focus:ring-8 focus:ring-green-500/5 transition-all font-semibold text-gray-900 placeholder:text-gray-300" required />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1" htmlFor="category">Market Category</label>
                                <select onChange={(e) => setCategory(e.target.value)} value={category}
                                    id="category" className="w-full bg-gray-50/50 outline-none py-5 px-6 rounded-2xl border border-gray-100 focus:border-green-500/50 focus:ring-8 focus:ring-green-500/5 transition-all font-semibold text-gray-900 cursor-pointer appearance-none" required>
                                    <option value="">Select Protocol Category</option>
                                    {categories.map((item, index) => (
                                        <option key={index} value={item.name}>{item.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1" htmlFor="weight">Net Weight</label>
                                    <input onChange={(e) => setWeight(e.target.value)} value={weight}
                                        id="weight" type="text" placeholder="e.g. 1kg" className="w-full bg-gray-50/50 outline-none py-5 px-6 rounded-2xl border border-gray-100 focus:border-green-500/50 font-semibold text-gray-900" required />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1" htmlFor="stock">Initial Count</label>
                                    <input onChange={(e) => setStock(e.target.value)} value={stock}
                                        id="stock" type="number" placeholder="0" className="w-full bg-gray-50/50 outline-none py-5 px-6 rounded-2xl border border-gray-100 focus:border-green-500/50 font-semibold text-gray-900" required />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100/60 shadow-sm space-y-8">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Valuation protocol</h3>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1" htmlFor="product-price">Market Value (₹)</label>
                                    <input onChange={(e) => setPrice(e.target.value)} value={price}
                                        id="product-price" type="number" placeholder="0" className="w-full bg-gray-50/50 outline-none py-5 px-6 rounded-2xl border border-gray-100 focus:border-green-500/50 font-semibold text-gray-900" required />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1" htmlFor="offer-price">Direct Rate (₹)</label>
                                    <input onChange={(e) => setOfferPrice(e.target.value)} value={offerPrice}
                                        id="offer-price" type="number" placeholder="0" className="w-full bg-green-50/50 outline-none py-5 px-6 rounded-2xl border border-green-100/50 focus:border-green-500/50 font-semibold text-green-700" required />
                                </div>
                            </div>
                            <p className="text-[10px] font-semibold text-green-600 uppercase tracking-widest bg-green-50 py-3 px-5 rounded-xl border border-green-100/50">
                                Tip: Competitive pricing increases conversion by up to 40%.
                            </p>
                        </div>

                        <button disabled={loading} className={`w-full py-6 mt-2 bg-green-600 text-white font-bold rounded-[1.5rem] transition-all shadow-xl shadow-green-500/20 hover:shadow-2xl hover:bg-green-700 uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-95 duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Encrypting & Publishing...
                                </>
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    Publish to storefront
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddProduct
