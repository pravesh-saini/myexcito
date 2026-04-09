'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black text-white mt-20">
      <div className="px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Get Help</h3>
            <ul className="space-y-2">
              <li><Link href="/order-status" className="text-gray-300 hover:text-white cursor-pointer">Order Status</Link></li>
              <li><Link href="/delivery" className="text-gray-300 hover:text-white cursor-pointer">Delivery</Link></li>
              <li><Link href="/returns" className="text-gray-300 hover:text-white cursor-pointer">Returns</Link></li>
              <li><Link href="/payment" className="text-gray-300 hover:text-white cursor-pointer">Payment Options</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white cursor-pointer">Contact Us</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">About Excito</h3>
            <ul className="space-y-2">
              <li><Link href="/news" className="text-gray-300 hover:text-white cursor-pointer">News</Link></li>
              <li><Link href="/careers" className="text-gray-300 hover:text-white cursor-pointer">Careers</Link></li>
              <li><Link href="/investors" className="text-gray-300 hover:text-white cursor-pointer">Investors</Link></li>
              <li><Link href="/sustainability" className="text-gray-300 hover:text-white cursor-pointer">Sustainability</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <button className="w-8 h-8 flex items-center justify-center cursor-pointer">
                <i className="ri-facebook-fill text-xl text-gray-300 hover:text-white"></i>
              </button>
              <button className="w-8 h-8 flex items-center justify-center cursor-pointer">
                <i className="ri-twitter-fill text-xl text-gray-300 hover:text-white"></i>
              </button>
              <button className="w-8 h-8 flex items-center justify-center cursor-pointer">
                <i className="ri-instagram-line text-xl text-gray-300 hover:text-white"></i>
              </button>
              <button className="w-8 h-8 flex items-center justify-center cursor-pointer">
                <i className="ri-youtube-fill text-xl text-gray-300 hover:text-white"></i>
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Newsletter</h3>
            <p className="text-gray-300 mb-4">Subscribe to get special offers and updates</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-l-lg border-none outline-none text-sm"
              />
              <button className="bg-white text-black px-6 py-2 rounded-r-lg font-medium hover:bg-gray-200 cursor-pointer whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© 2024 Excito, Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-gray-400 hover:text-white text-sm cursor-pointer">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white text-sm cursor-pointer">Terms of Service</Link>
            <Link href="/cookies" className="text-gray-400 hover:text-white text-sm cursor-pointer">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}