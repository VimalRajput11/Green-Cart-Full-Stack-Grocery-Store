import React, { useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Page, PageHeader, Card, Button, Field, Icon, inputCls } from '../../components/Seller/ui';

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

    const { axios, categories, fetchProducts, currency } = useAppContext();
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
                // Refresh products list immediately for real-time updates
                await fetchProducts();
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

    const setFileAt = (index, file) => {
        const updatedFiles = [...files];
        updatedFiles[index] = file;
        setFiles(updatedFiles);
    };

    const p = Number(price), op = Number(offerPrice);
    const discount = p > 0 && op > 0 && op < p ? Math.round(((p - op) / p) * 100) : 0;
    const priceError = p > 0 && op > p;
    const photoCount = files.filter(Boolean).length;

    return (
        <Page max="max-w-[1100px]">
            <PageHeader
                eyebrow={<button type="button" onClick={() => navigate('/seller/product-list')} className="inline-flex items-center gap-1 hover:text-green-800"><Icon name="chevronRight" className="w-3.5 h-3.5 rotate-180" strokeWidth={2.2} />Products</button>}
                title="Add product"
                subtitle="Create a new listing for your storefront."
            />

            <form onSubmit={onSubmitHandler} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
                {/* Main column */}
                <div className="space-y-6">
                    <Card title="Product details" subtitle="What customers see on the product page" bodyClass="px-5 pb-5 space-y-4">
                        <Field label="Product name" htmlFor="product-name">
                            <input onChange={(e) => setName(e.target.value)} value={name} id="product-name" type="text" placeholder="e.g. Organic Alphonso Mango" className={inputCls} required />
                        </Field>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Category" htmlFor="category">
                                <select onChange={(e) => setCategory(e.target.value)} value={category} id="category" className={`${inputCls} cursor-pointer`} required>
                                    <option value="">Select a category</option>
                                    {categories.map((item, index) => (
                                        <option key={index} value={item.name}>{item.name}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Net weight" htmlFor="weight">
                                <input onChange={(e) => setWeight(e.target.value)} value={weight} id="weight" type="text" placeholder="e.g. 1 kg" className={inputCls} />
                            </Field>
                        </div>
                        <Field label="Description" htmlFor="product-description" hint="Each line becomes a separate bullet point.">
                            <textarea onChange={(e) => setDescription(e.target.value)} value={description} id="product-description" rows={5}
                                className={`${inputCls} h-auto py-2.5 resize-none leading-relaxed`}
                                placeholder={'Fresh and hand-picked\nRich in vitamin C\nSourced from local farms'} />
                        </Field>
                    </Card>

                    <Card title="Pricing & inventory" bodyClass="px-5 pb-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Field label="MRP" htmlFor="product-price">
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">{currency}</span>
                                    <input onChange={(e) => setPrice(e.target.value)} value={price} id="product-price" type="number" min="0" placeholder="0" className={`${inputCls} pl-8`} required />
                                </div>
                            </Field>
                            <Field label="Selling price" htmlFor="offer-price">
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">{currency}</span>
                                    <input onChange={(e) => setOfferPrice(e.target.value)} value={offerPrice} id="offer-price" type="number" min="0" placeholder="0"
                                        className={`${inputCls} pl-8 ${priceError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`} required />
                                </div>
                            </Field>
                            <Field label="Stock" htmlFor="stock">
                                <input onChange={(e) => setStock(e.target.value)} value={stock} id="stock" type="number" min="0" placeholder="0" className={inputCls} required />
                            </Field>
                        </div>
                        {priceError ? (
                            <p className="flex items-center gap-2 text-sm text-red-700 bg-red-50 ring-1 ring-inset ring-red-200 rounded-xl px-3.5 py-2.5">
                                <Icon name="alert" className="w-4 h-4" /> Selling price is higher than MRP.
                            </p>
                        ) : discount > 0 ? (
                            <p className="flex items-center gap-2 text-sm text-green-800 bg-green-50 ring-1 ring-inset ring-green-200 rounded-xl px-3.5 py-2.5">
                                <Icon name="tag" className="w-4 h-4 text-green-600" /> Customers save <span className="font-semibold">{discount}%</span> ({currency}{p - op} off MRP).
                            </p>
                        ) : null}
                    </Card>
                </div>

                {/* Side column */}
                <div className="space-y-6 lg:sticky lg:top-6">
                    <Card title="Photos" subtitle={`${photoCount} of 4 added · first photo is the cover`} bodyClass="px-5 pb-5">
                        <div className="grid grid-cols-2 gap-3">
                            {Array(4).fill('').map((_, index) => (
                                <label key={index} htmlFor={`image${index}`} className="group relative cursor-pointer">
                                    <input onChange={(e) => { setFileAt(index, e.target.files[0]); e.target.value = ''; }} type="file" accept="image/*" id={`image${index}`} hidden />
                                    <div className={`aspect-square w-full rounded-xl flex items-center justify-center overflow-hidden transition
                                        ${files[index] ? 'ring-1 ring-slate-200 bg-white p-2' : 'border-2 border-dashed border-slate-200 bg-slate-50/70 group-hover:border-green-400 group-hover:bg-green-50/50'}`}>
                                        {files[index] ? (
                                            <img className="max-w-full max-h-full object-contain" src={URL.createObjectURL(files[index])} alt="" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1.5 text-slate-400 group-hover:text-green-600">
                                                <Icon name={index === 0 ? 'image' : 'plus'} className="w-6 h-6" />
                                                <span className="text-[11px] font-medium">{index === 0 ? 'Cover photo' : 'Add photo'}</span>
                                            </div>
                                        )}
                                    </div>
                                    {files[index] && (
                                        <>
                                            {index === 0 && <span className="absolute top-2 left-2 text-[10px] font-semibold bg-slate-900/80 text-white rounded-md px-1.5 py-0.5">Cover</span>}
                                            <button type="button" onClick={(e) => { e.preventDefault(); setFileAt(index, undefined); }}
                                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/95 shadow ring-1 ring-slate-200 text-slate-500 hover:text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition" aria-label="Remove photo">
                                                <Icon name="close" className="w-3.5 h-3.5" strokeWidth={2.4} />
                                            </button>
                                        </>
                                    )}
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-3">PNG, JPG or WEBP. Images are compressed automatically.</p>
                    </Card>

                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-5 space-y-3">
                        <Button type="submit" size="lg" icon="check" loading={loading} disabled={priceError} className="w-full">
                            {loading ? 'Publishing…' : 'Publish product'}
                        </Button>
                        <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/seller/product-list')}>Cancel</Button>
                    </div>
                </div>
            </form>
        </Page>
    )
}

export default AddProduct
