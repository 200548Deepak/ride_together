'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import FloatingSearchBar from '@/components/FloatingSearchBar';

interface PopularRoute {
  origin: string;
  destination: string;
  price: number;
  duration: string;
}

const POPULAR_ROUTES: PopularRoute[] = [
  { origin: 'Bengaluru', destination: 'Mysuru', price: 350, duration: '2h 15m' },
  { origin: 'Mumbai', destination: 'Pune', price: 300, duration: '2h 45m' },
  { origin: 'New Delhi', destination: 'Jaipur', price: 450, duration: '4h 30m' },
  { origin: 'Bengaluru', destination: 'Chennai', price: 550, duration: '5h 15m' },
  { origin: 'Hyderabad', destination: 'Vijayawada', price: 400, duration: '4h 20m' },
  { origin: 'Pune', destination: 'Goa', price: 850, duration: '7h 45m' }
];

const FAQS = [
  {
    q: 'How do I book a carpool ride?',
    a: 'You can book a carpool ride on Ride Together by simply entering your departure and arrival cities along with your date of travel. Choose a ride that fits your schedule, review the driver profile and ratings, and click "Book". You can either pay directly in cash to the driver or choose online payment.'
  },
  {
    q: 'How do I publish a ride on Ride Together?',
    a: 'Offering a carpool ride is simple and free. Click "Publish a ride", enter your exact departure address, arrival destination, stopovers, travel date and time, available seats, and vehicle details. Our smart algorithm recommends a fair price per seat based on your route distance.'
  },
  {
    q: 'What if a driver cancels the ride?',
    a: 'If a driver cancels, you receive an instant alert via SMS and email. Any online payments are refunded 100% to your original payment method immediately, and our system helps you easily find alternative rides for your destination.'
  },
  {
    q: 'How does driver verification work?',
    a: 'Every carpool driver on Ride Together is checked against official government-issued ID (Aadhaar / Driving License), verified mobile numbers, and email accounts. You can also view reviews and star ratings left by previous passengers.'
  },
  {
    q: 'Can I travel with luggage or pets?',
    a: 'Yes. Every driver specifies their vehicle luggage capacity (Small bag, Medium suitcase, or Large suitcase) and amenity rules (Pets allowed, Air Conditioning, Smoking policy) directly in their ride listing.'
  }
];

export default function HomePage() {
  const router = useRouter();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleRouteClick = (route: PopularRoute) => {
    const today = new Date().toISOString().split('T')[0];
    const params = new URLSearchParams({
      fn: route.origin,
      tn: route.destination,
      db: today,
      seats: '1',
      search_origin: 'POPULAR_ROUTES',
      transport_type: 'CARPOOLING'
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white text-[#054752] flex flex-col font-sans">
      {/* 1. Global Navigation Header */}
      <Header />

      {/* 2. Hero Section */}
      <section className="relative bg-gradient-to-b from-[#f4f7f8] via-[#eef4f7] to-white pt-12 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle decorative background blur circles */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-cyan-200/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-blue-100/40 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-cyan-100/80 text-[#00aff5]">
            India&apos;s Trusted Carpool Community
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#054752] tracking-tight leading-[1.1]">
            Your pick of rides at low prices
          </h1>

          <p className="max-w-2xl mx-auto text-[#708c91] text-base sm:text-lg font-medium">
            No matter where you&apos;re going, find the perfect ride from our wide range of destinations and routes at low prices.
          </p>

          {/* Floating Search Capsule Bar */}
          <div className="pt-8">
            <FloatingSearchBar />
          </div>
        </div>
      </section>

      {/* 3. The 3 Value Pillars */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Pillar 1 */}
          <div className="space-y-3.5 p-6 rounded-3xl bg-[#f8fafb] border border-gray-100 hover:shadow-lg transition-all">
            <div className="w-14 h-14 rounded-2xl bg-cyan-100 text-[#00aff5] flex items-center justify-center text-2xl shadow-xs">
              💰
            </div>
            <h3 className="text-xl font-black text-[#054752]">
              At low prices
            </h3>
            <p className="text-sm font-medium text-[#708c91] leading-relaxed">
              Save on your travel costs by sharing a ride. Carpool drivers share their fuel and toll costs, so you travel affordably at unbeatable rates.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="space-y-3.5 p-6 rounded-3xl bg-[#f8fafb] border border-gray-100 hover:shadow-lg transition-all">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl shadow-xs">
              🛡️
            </div>
            <h3 className="text-xl font-black text-[#054752]">
              Trust who you travel with
            </h3>
            <p className="text-sm font-medium text-[#708c91] leading-relaxed">
              We take the time to verify every member. We check government IDs, phone numbers, and driver ratings so you always travel with peace of mind.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="space-y-3.5 p-6 rounded-3xl bg-[#f8fafb] border border-gray-100 hover:shadow-lg transition-all">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#00aff5] flex items-center justify-center text-2xl shadow-xs">
              ⚡
            </div>
            <h3 className="text-xl font-black text-[#054752]">
              Scroll, click, tap and go!
            </h3>
            <p className="text-sm font-medium text-[#708c91] leading-relaxed">
              Booking a ride has never been easier! Powered by intelligent routing algorithms, you can discover, reserve, and hop on a ride near you in minutes.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Driver Banner ("Drive and save on travel costs") */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="relative rounded-3xl bg-[#054752] text-white p-8 sm:p-12 overflow-hidden shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 text-cyan-300">
              For Drivers
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Drive and save on travel costs
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Heading somewhere with empty seats? Share your car, split the cost of petrol and tolls, and make intercity travel more social and eco-friendly.
            </p>
            <div className="pt-2">
              <Link
                href="/offer-seats/departure"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-sm text-[#054752] bg-[#00aff5] hover:bg-[#0098d6] transition-all shadow-md cursor-pointer"
              >
                <span>Publish a ride</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          <div className="w-full md:w-80 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚗</span>
              <div>
                <p className="text-xs uppercase font-bold text-cyan-300">Popular Route</p>
                <p className="text-base font-extrabold">Bengaluru ➔ Mysuru</p>
              </div>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between text-xs">
              <span className="text-slate-300">Estimated driver savings:</span>
              <span className="font-bold text-emerald-300">₹700 – ₹1,050 / trip</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Popular Indian Carpool Routes Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-8">
        <div>
          <h2 className="text-3xl font-black text-[#054752] tracking-tight">
            Popular carpool routes
          </h2>
          <p className="text-[#708c91] text-sm mt-1">
            Book reliable, affordable seats on India&apos;s most popular highway corridors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {POPULAR_ROUTES.map(r => (
            <div
              key={`${r.origin}-${r.destination}`}
              onClick={() => handleRouteClick(r)}
              className="p-5 rounded-2xl bg-white border border-gray-100 hover:border-cyan-300 hover:shadow-lg transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-base font-black text-[#054752] group-hover:text-[#00aff5] transition-colors">
                  <span>{r.origin}</span>
                  <span className="text-[#708c91]">→</span>
                  <span>{r.destination}</span>
                </div>
                <div className="text-xs text-[#708c91] flex items-center gap-2">
                  <span>⏱️ {r.duration}</span>
                  <span>•</span>
                  <span>Carpool</span>
                </div>
              </div>

              <div className="text-right pl-3">
                <span className="block text-xs font-semibold text-[#708c91]">from</span>
                <span className="text-lg font-black text-[#054752]">₹{r.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Environmental Sustainability Banner */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="p-8 rounded-3xl bg-emerald-50/70 border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white text-2xl flex items-center justify-center shrink-0 shadow-md">
              🌿
            </div>
            <div>
              <h3 className="text-xl font-black text-[#054752]">
                Save money while saving the planet
              </h3>
              <p className="text-xs sm:text-sm text-[#708c91] mt-0.5 max-w-xl">
                Sharing a car saves an average of 14.8 kg CO₂ per trip compared to driving solo. Join our community in reducing highway congestion and carbon footprint.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="block text-2xl font-black text-emerald-700">1.5M+ Tons</span>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">CO₂ Saved Globally</span>
          </div>
        </div>
      </section>

      {/* 7. Frequently Asked Questions (FAQ) Accordion */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-[#054752] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-[#708c91]">
            Everything you need to know about sharing rides on Ride Together.
          </p>
        </div>

        <div className="divide-y divide-gray-100 rounded-3xl bg-[#f8fafb] border border-gray-100 p-4 sm:p-6">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="py-4 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full text-left flex items-center justify-between gap-4 font-bold text-base text-[#054752] hover:text-[#00aff5] transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className="text-[#00aff5] text-xl font-bold shrink-0">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <p className="mt-3 text-sm text-[#708c91] leading-relaxed animate-in fade-in duration-150">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. Global Multi-Column Footer */}
      <footer className="mt-auto bg-[#f4f7f8] border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          {/* Col 1 */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#054752]">Top Carpool Routes</h4>
            <ul className="space-y-2 text-[#708c91] text-xs">
              <li><Link href="/search?fn=Bengaluru&tn=Mysuru" className="hover:underline">Bengaluru → Mysuru</Link></li>
              <li><Link href="/search?fn=Mumbai&tn=Pune" className="hover:underline">Mumbai → Pune</Link></li>
              <li><Link href="/search?fn=New+Delhi&tn=Jaipur" className="hover:underline">Delhi → Jaipur</Link></li>
              <li><Link href="/search?fn=Bengaluru&tn=Chennai" className="hover:underline">Bengaluru → Chennai</Link></li>
              <li><Link href="/search?fn=Hyderabad&tn=Vijayawada" className="hover:underline">Hyderabad → Vijayawada</Link></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#054752]">About Ride Together</h4>
            <ul className="space-y-2 text-[#708c91] text-xs">
              <li><span className="hover:underline cursor-pointer">How It Works</span></li>
              <li><span className="hover:underline cursor-pointer">About Us</span></li>
              <li><span className="hover:underline cursor-pointer">Sustainability</span></li>
              <li><span className="hover:underline cursor-pointer">Press & Media</span></li>
              <li><span className="hover:underline cursor-pointer">Careers</span></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#054752]">Safety & Support</h4>
            <ul className="space-y-2 text-[#708c91] text-xs">
              <li><span className="hover:underline cursor-pointer">Help Centre</span></li>
              <li><span className="hover:underline cursor-pointer">Safety Guidelines</span></li>
              <li><span className="hover:underline cursor-pointer">Insurance Protection</span></li>
              <li><span className="hover:underline cursor-pointer">Driver Verification</span></li>
              <li><span className="hover:underline cursor-pointer">Community Standards</span></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#054752]">Region & Legal</h4>
            <ul className="space-y-2 text-[#708c91] text-xs">
              <li><span className="font-bold text-[#054752]">🌐 English (India)</span></li>
              <li><span className="font-bold text-[#054752]">₹ INR (Indian Rupee)</span></li>
              <li><span className="hover:underline cursor-pointer">Terms & Conditions</span></li>
              <li><span className="hover:underline cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:underline cursor-pointer">Cookie Settings</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-8 mt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-xs text-[#708c91] gap-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#00aff5] text-white flex items-center justify-center font-black text-[10px]">
              R
            </span>
            <span className="font-bold text-[#054752]">Ride Together India</span>
            <span>• Exact BlaBlaCar Replica Platform</span>
          </div>
          <p>© {new Date().getFullYear()} Ride Together. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
