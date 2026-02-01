import React from 'react';
import { assets } from '../assets/assets';
import toast from 'react-hot-toast';

const Contact = () => {

    const onSubmit = (e) => {
        e.preventDefault();
        toast.success("Thank you for contacting us! We'll get back to you soon.");
        e.target.reset(); // Clear the form
    }

    return (
        <div id="contact" className="mt-20 scroll-mt-24">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-serif">Contact Us</h2>
                <p className="text-gray-500 mt-3 max-w-2xl mx-auto">Have questions about our fresh produce or your order? We're here to help you every step of the way.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-10 lg:gap-16 bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100">

                {/* Info Section */}
                <div className="bg-primary p-10 md:p-12 text-white md:w-2/5 flex flex-col justify-between">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Get in touch</h3>
                        <p className="opacity-90 leading-relaxed mb-8">Visit our farm or send us a message. We love hearing from our community.</p>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg">Our Location</h4>
                                    <p className="opacity-80 text-sm mt-1">123 Organic Farms Lane,<br />Green Valley, CA 90210</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg">Email Us</h4>
                                    <p className="opacity-80 text-sm mt-1">support@greencart.com<br />careers@greencart.com</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg">Call Us</h4>
                                    <p className="opacity-80 text-sm mt-1">+1 (555) 123-4567<br />Mon-Fri, 9am - 6pm</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 md:mt-0">
                        <p className="text-sm font-medium opacity-70 uppercase tracking-widest mb-4">Follow Us</p>
                        <div className="flex gap-4">
                            {/* Social dummy icons */}
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 cursor-pointer transition">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                            </div>
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 cursor-pointer transition">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-10 md:p-12 md:w-3/5">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h3>
                    <form onSubmit={onSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col md:flex-row gap-5">
                            <input type="text" placeholder="Your Name" required className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-gray-50/50" />
                            <input type="email" placeholder="Your Email" required className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-gray-50/50" />
                        </div>
                        <input type="text" placeholder="Subject" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-gray-50/50" />
                        <textarea rows="5" placeholder="Write your message here..." required className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-gray-50/50 resize-none"></textarea>

                        <button type="submit" className="self-start px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Contact;
