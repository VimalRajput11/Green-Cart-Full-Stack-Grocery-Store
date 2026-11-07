import React, { useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast';
import { optimizeImg } from '../../utils/image';
import { Page, PageHeader, Card, Badge, Button, Field, EmptyState, SearchInput, Icon, inputCls } from '../../components/Seller/ui';

const AddCategory = () => {

    const [image, setImage] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const { axios, getCategories, categories, confirmAction, products } = useAppContext();

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
            "Delete category",
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

    const countFor = (catName) => (products || []).filter((p) => p.category === catName).length;
    const list = (categories || []).filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()));

    return (
        <Page>
            <PageHeader
                title="Categories"
                subtitle="Group your products so customers can find them quickly."
            />

            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
                {/* Add Category Form */}
                <Card title="New category" subtitle="Shown on the storefront home page" className="lg:sticky lg:top-6" bodyClass="px-5 pb-5">
                    <form onSubmit={onSubmitHandler} className="space-y-4">
                        <Field label="Cover image">
                            <label htmlFor="category-image" className={`group relative cursor-pointer w-full aspect-[16/10] rounded-xl overflow-hidden flex items-center justify-center transition
                                ${image ? 'ring-1 ring-slate-200 bg-slate-50 p-3' : 'border-2 border-dashed border-slate-200 bg-slate-50/70 hover:border-green-400 hover:bg-green-50/50'}`}>
                                {image ? (
                                    <>
                                        <img className="w-full h-full object-contain" src={URL.createObjectURL(image)} alt="" />
                                        <span className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-white text-sm font-medium">
                                            <Icon name="upload" className="w-4 h-4" /> Replace image
                                        </span>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-green-600">
                                        <span className="w-10 h-10 rounded-xl bg-white ring-1 ring-slate-200 flex items-center justify-center shadow-sm"><Icon name="upload" className="w-5 h-5" /></span>
                                        <span className="text-sm font-medium text-slate-600">Click to upload</span>
                                        <span className="text-xs">PNG, JPG or WEBP</span>
                                    </div>
                                )}
                                <input onChange={(e) => { setImage(e.target.files[0] || false); e.target.value = ''; }} type="file" accept="image/*" id="category-image" hidden />
                            </label>
                        </Field>

                        <Field label="Name" htmlFor="category-name">
                            <input onChange={(e) => setName(e.target.value)} value={name} id="category-name" type="text" placeholder="e.g. Exotic Fruits" className={inputCls} required />
                        </Field>

                        <Field label="Description" htmlFor="category-desc" hint="Optional. A short line about what's in this category.">
                            <textarea onChange={(e) => setDescription(e.target.value)} value={description} id="category-desc" rows={3}
                                className={`${inputCls} h-auto py-2.5 resize-none leading-relaxed`} placeholder="Seasonal and imported fruits" />
                        </Field>

                        <Button type="submit" icon="plus" loading={loading} className="w-full">
                            {loading ? 'Creating…' : 'Create category'}
                        </Button>
                    </form>
                </Card>

                {/* Categories List */}
                <Card
                    title={<span className="flex items-center gap-2">All categories <Badge tone="green">{categories?.length || 0}</Badge></span>}
                    action={<SearchInput className="w-44 sm:w-56" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />}
                    bodyClass="px-5 pb-5"
                >
                    {list.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                            {list.map((item) => {
                                const count = countFor(item.name);
                                return (
                                    <div key={item._id} className="group relative flex items-center gap-3.5 p-3 rounded-xl ring-1 ring-inset ring-slate-200/80 bg-white hover:ring-slate-300 hover:shadow-md transition-all">
                                        <div className="w-14 h-14 rounded-xl bg-slate-50 ring-1 ring-slate-100 overflow-hidden p-1.5 shrink-0">
                                            <img src={optimizeImg(item.image, 120)} alt="" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-slate-900 text-sm truncate">{item.name}</p>
                                            <p className="text-xs text-slate-500 truncate mt-0.5">{item.description || 'No description'}</p>
                                            <p className="text-[11px] font-medium text-slate-400 mt-1">{count} product{count === 1 ? '' : 's'}</p>
                                        </div>
                                        <button
                                            onClick={() => deleteCategoryHandler(item._id)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                                            title="Delete category"
                                            aria-label={`Delete ${item.name}`}
                                        >
                                            <Icon name="trash" className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            icon="tag"
                            title={categories?.length ? 'No matching categories' : 'No categories yet'}
                            text={categories?.length ? 'Try a different search.' : 'Create your first category using the form.'}
                        />
                    )}
                </Card>
            </div>
        </Page>
    )
}

export default AddCategory;
