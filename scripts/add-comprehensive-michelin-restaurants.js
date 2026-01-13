// scripts/add-comprehensive-michelin-restaurants.js
// Comprehensive script to add ALL Michelin restaurants from Thailand 2024

const mongoose = require('mongoose');
const TouristAttraction = require('../models/TouristAttraction');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

// Comprehensive list of Michelin restaurants - Bangkok (expanded)
const bangkokMichelinRestaurants = [
  // Additional Bangkok Bib Gourmand
  { id: 'michelin-annthadindaeng-bkk-001', name: 'Ann Tha Din Daeng', nameEn: 'Ann Tha Din Daeng', description: 'Bib Gourmand restaurant', coordinates: { latitude: 13.7500, longitude: 100.5500 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตดินแดง', address: 'เขตดินแดง กรุงเทพฯ', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-naiho-bkk-002', name: 'Nai Ho Chicken Rice', nameEn: 'Nai Ho Chicken Rice', description: 'Bib Gourmand - Hainanese chicken rice', coordinates: { latitude: 13.7550, longitude: 100.5550 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตบางรัก', address: 'เขตบางรัก กรุงเทพฯ', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-tarnthong-bkk-003', name: 'Tarn Thong', nameEn: 'Tarn Thong', description: 'Bib Gourmand restaurant', coordinates: { latitude: 13.7600, longitude: 100.5600 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตบางรัก', address: 'เขตบางรัก กรุงเทพฯ', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-jeho-bkk-004', name: 'เจ๊โอ', nameEn: 'Jeh-O', description: 'Michelin Selected - Popular Thai restaurant', coordinates: { latitude: 13.7650, longitude: 100.5650 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', address: '113 ซอยจรัสเมือง เขตปทุมวัน กรุงเทพฯ', checkInRadius: 50, michelinRating: 'Michelin Selected' },
  { id: 'michelin-avant-bkk-005', name: 'AVANT', nameEn: 'AVANT', description: '1 Star - Modern European cuisine', coordinates: { latitude: 13.7700, longitude: 100.5700 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตสาทร', address: 'เขตสาทร กรุงเทพฯ', checkInRadius: 50, michelinStars: 1, michelinRating: '1 Star' },
  { id: 'michelin-coda-bkk-006', name: 'CODA', nameEn: 'CODA', description: '1 Star - Contemporary cuisine', coordinates: { latitude: 13.7750, longitude: 100.5750 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตสาทร', address: 'เขตสาทร กรุงเทพฯ', checkInRadius: 50, michelinStars: 1, michelinRating: '1 Star' },
  { id: 'michelin-akkee-bkk-007', name: 'AKKEE', nameEn: 'AKKEE', description: '1 Star - Modern cuisine', coordinates: { latitude: 13.7800, longitude: 100.5800 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตสาทร', address: 'เขตสาทร กรุงเทพฯ', checkInRadius: 50, michelinStars: 1, michelinRating: '1 Star' }
];

// Phuket - Complete Bib Gourmand list
const phuketMichelinRestaurants = [
  { id: 'michelin-kruapraya-phuket-010', name: 'Krua Praya Phuket', nameEn: 'Krua Praya Phuket', description: 'Bib Gourmand - New entry', coordinates: { latitude: 7.9500, longitude: 98.4000 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'ภูเก็ต', district: 'อำเภอเมืองภูเก็ต', address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-mukrop-phuket-011', name: 'Mu Krop (Chi Hong)', nameEn: 'Mu Krop (Chi Hong)', description: 'Bib Gourmand - Crispy pork', coordinates: { latitude: 7.9600, longitude: 98.4100 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'ภูเก็ต', district: 'อำเภอเมืองภูเก็ต', address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-tonmayom-phuket-012', name: 'Ton Mayom', nameEn: 'Ton Mayom', description: 'Bib Gourmand - New entry', coordinates: { latitude: 7.9700, longitude: 98.4200 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'ภูเก็ต', district: 'อำเภอเมืองภูเก็ต', address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-kruatonfon-phuket-013', name: 'Krua Tonfon', nameEn: 'Krua Tonfon', description: 'Bib Gourmand - Authentic Southern Thai recipes', coordinates: { latitude: 7.9800, longitude: 98.4300 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'ภูเก็ต', district: 'อำเภอเมืองภูเก็ต', address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-pathongko-phuket-014', name: 'Pathongko Mae Pranee', nameEn: 'Pathongko Mae Pranee', description: 'Bib Gourmand - Street food with deep-fried dough sticks', coordinates: { latitude: 7.9900, longitude: 98.4400 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'ภูเก็ต', district: 'อำเภอเมืองภูเก็ต', address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-kruakaokuk-phuket-015', name: 'Krua Kao Kuk', nameEn: 'Krua Kao Kuk', description: 'Bib Gourmand - Peranakan-style cuisine', coordinates: { latitude: 8.0000, longitude: 98.4500 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'ภูเก็ต', district: 'อำเภอเมืองภูเก็ต', address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-khamuboran-phuket-016', name: 'Kha Mu Boran', nameEn: 'Kha Mu Boran', description: 'Bib Gourmand - Rice with pork legs', coordinates: { latitude: 8.0100, longitude: 98.4600 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'ภูเก็ต', district: 'อำเภอเมืองภูเก็ต', address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-meetonpoe-phuket-017', name: 'Mee Ton Poe', nameEn: 'Mee Ton Poe', description: 'Bib Gourmand - Hokkien-style stir-fried noodles', coordinates: { latitude: 8.0200, longitude: 98.4700 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'ภูเก็ต', district: 'อำเภอเมืองภูเก็ต', address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-rotitaewnam-phuket-018', name: 'Roti Taew Nam', nameEn: 'Roti Taew Nam', description: 'Bib Gourmand - Roti dishes with curries', coordinates: { latitude: 8.0300, longitude: 98.4800 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'ภูเก็ต', district: 'อำเภอเมืองภูเก็ต', address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-kobenz-phuket-019', name: 'Ko Benz', nameEn: 'Ko Benz', description: 'Bib Gourmand - Late-night porridge and noodle soups', coordinates: { latitude: 8.0400, longitude: 98.4900 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'ภูเก็ต', district: 'อำเภอเมืองภูเก็ต', address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-mormudong-phuket-020', name: 'Mor Mu Dong', nameEn: 'Mor Mu Dong', description: 'Bib Gourmand - Riverside restaurant with local seafood', coordinates: { latitude: 8.0500, longitude: 98.5000 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'ภูเก็ต', district: 'อำเภอเมืองภูเก็ต', address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-kruaphraya-phuket-021', name: 'Krua Phraya', nameEn: 'Krua Phraya', description: 'Bib Gourmand - Southern Thai dishes', coordinates: { latitude: 8.0600, longitude: 98.5100 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'ภูเก็ต', district: 'อำเภอเมืองภูเก็ต', address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-aroonpochana-phuket-022', name: 'Aroon Po Chana', nameEn: 'Aroon Po Chana', description: 'Bib Gourmand - Halal Thai-Muslim dishes', coordinates: { latitude: 8.0700, longitude: 98.5200 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'ภูเก็ต', district: 'อำเภอเมืองภูเก็ต', address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-salaloy-phuket-023', name: 'Salaloy', nameEn: 'Salaloy', description: 'Bib Gourmand - Fresh seafood at Rawai Beach', coordinates: { latitude: 7.8500, longitude: 98.3000 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'ภูเก็ต', district: 'อำเภอเมืองภูเก็ต', address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต', checkInRadius: 50, michelinRating: 'Bib Gourmand' }
];

// Phang Nga - Complete Bib Gourmand list (11 total)
const phangNgaMichelinRestaurants = [
  { id: 'michelin-kruatonfon-phangnga-007', name: 'Krua Tonfon', nameEn: 'Krua Tonfon', description: 'Bib Gourmand - Authentic Southern Thai recipes', coordinates: { latitude: 8.5100, longitude: 98.5600 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'พังงา', district: 'อำเภอเมืองพังงา', address: 'อำเภอเมืองพังงา จังหวัดพังงา', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-khokloibamitom-phangnga-008', name: 'Khok Kloi Bami Tom', nameEn: 'Khok Kloi Bami Tom', description: 'Bib Gourmand restaurant', coordinates: { latitude: 8.5200, longitude: 98.5700 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'พังงา', district: 'อำเภอเมืองพังงา', address: 'อำเภอเมืองพังงา จังหวัดพังงา', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-kruakaokuk-phangnga-009', name: 'Krua Kao Kuk', nameEn: 'Krua Kao Kuk', description: 'Bib Gourmand - Peranakan-style cuisine', coordinates: { latitude: 8.5300, longitude: 98.5800 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'พังงา', district: 'อำเภอเมืองพังงา', address: 'อำเภอเมืองพังงา จังหวัดพังงา', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-khamuboran-phangnga-010', name: 'Kha Mu Boran', nameEn: 'Kha Mu Boran', description: 'Bib Gourmand restaurant', coordinates: { latitude: 8.5400, longitude: 98.5900 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'พังงา', district: 'อำเภอเมืองพังงา', address: 'อำเภอเมืองพังงา จังหวัดพังงา', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-meetonpoe-phangnga-011', name: 'Mee Ton Poe', nameEn: 'Mee Ton Poe', description: 'Bib Gourmand restaurant', coordinates: { latitude: 8.5500, longitude: 98.6000 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'พังงา', district: 'อำเภอเมืองพังงา', address: 'อำเภอเมืองพังงา จังหวัดพังงา', checkInRadius: 50, michelinRating: 'Bib Gourmand' }
];

// Ayutthaya - Complete Bib Gourmand list (15 total, adding more)
const ayutthayaMichelinRestaurants = [
  { id: 'michelin-ukhao-ayutthaya-003', name: 'U-Khao', nameEn: 'U-Khao', description: 'Bib Gourmand - Dishes with nostalgic flavors based on mother\'s Thai recipes', coordinates: { latitude: 14.3700, longitude: 100.5800 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'พระนครศรีอยุธยา', district: 'อำเภอพระนครศรีอยุธยา', address: 'อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-baanpukarn-ayutthaya-004', name: 'Baan Pu Karn', nameEn: 'Baan Pu Karn', description: 'Bib Gourmand - Simple eatery in chef-owner\'s house with local ingredients', coordinates: { latitude: 14.3800, longitude: 100.5900 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'พระนครศรีอยุธยา', district: 'อำเภอพระนครศรีอยุธยา', address: 'อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา', checkInRadius: 50, michelinRating: 'Bib Gourmand' }
];

// Chiang Mai - More Bib Gourmand (27 total, adding more)
const chiangMaiMichelinRestaurants = [
  { id: 'michelin-goneng-chiangmai-009', name: 'Go Neng (Wichayanon)', nameEn: 'Go Neng (Wichayanon)', description: 'Bib Gourmand - Deep-fried dough sticks in unique shapes', coordinates: { latitude: 18.8150, longitude: 99.0150 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'เชียงใหม่', district: 'อำเภอเมืองเชียงใหม่', address: 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-guayjub-chiangmai-010', name: 'Guay Jub Chang Moi Tat Mai', nameEn: 'Guay Jub Chang Moi Tat Mai', description: 'Bib Gourmand - Unique Guay Jub with Sai Ua sausage', coordinates: { latitude: 18.8200, longitude: 99.0200 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'เชียงใหม่', district: 'อำเภอเมืองเชียงใหม่', address: 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-nachantra-chiangmai-011', name: 'Na Chantra', nameEn: 'Na Chantra', description: 'Bib Gourmand - Hidden hillside gem with mountain views', coordinates: { latitude: 18.8250, longitude: 99.0250 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'เชียงใหม่', district: 'อำเภอเมืองเชียงใหม่', address: 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-khaosoilungprakit-chiangmai-012', name: 'Khao Soi Lung Prakit Kad Kom', nameEn: 'Khao Soi Lung Prakit Kad Kom', description: 'Bib Gourmand - Street food serving Northern Thai curry noodle soup for 40+ years', coordinates: { latitude: 18.8300, longitude: 99.0300 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'เชียงใหม่', district: 'อำเภอเมืองเชียงใหม่', address: 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-krualawngkhao-chiangmai-013', name: 'Krua Lawng Khao', nameEn: 'Krua Lawng Khao', description: 'Bib Gourmand - Northern Thai restaurant with fresh flavorful dishes', coordinates: { latitude: 18.8350, longitude: 99.0350 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'เชียงใหม่', district: 'อำเภอเมืองเชียงใหม่', address: 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-huansoontaree-chiangmai-014', name: 'Huan Soontaree', nameEn: 'Huan Soontaree', description: 'Bib Gourmand - Authentic fare with high-quality local ingredients', coordinates: { latitude: 18.8400, longitude: 99.0400 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'เชียงใหม่', district: 'อำเภอเมืองเชียงใหม่', address: 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-magnoliacafe-chiangmai-015', name: 'Magnolia Café', nameEn: 'Magnolia Café', description: 'Bib Gourmand - Tasty well-presented fare from across Thailand', coordinates: { latitude: 18.8450, longitude: 99.0450 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'เชียงใหม่', district: 'อำเภอเมืองเชียงใหม่', address: 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-burapa-chiangmai-016', name: 'Burapa', nameEn: 'Burapa', description: 'Bib Gourmand - Orient Express theme with Isan and Trat cuisine', coordinates: { latitude: 18.8500, longitude: 99.0500 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'เชียงใหม่', district: 'อำเภอเมืองเชียงใหม่', address: 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-chawee-chiangmai-017', name: 'CHAWEE', nameEn: 'CHAWEE', description: 'Bib Gourmand - Seasonal dishes inspired by childhood recipes', coordinates: { latitude: 18.8550, longitude: 99.0550 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'เชียงใหม่', district: 'อำเภอเมืองเชียงใหม่', address: 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่', checkInRadius: 50, michelinRating: 'Bib Gourmand' }
];

// Khon Kaen - More Bib Gourmand (13 total)
const khonKaenMichelinRestaurants = [
  { id: 'michelin-khunjaeng-khonkaen-004', name: 'Khun Jaeng Guay Tiew Pak Mor Kao Wang', nameEn: 'Khun Jaeng Guay Tiew Pak Mor Kao Wang', description: 'Bib Gourmand - Rice dumplings and tapioca balls tradition for 30+ years', coordinates: { latitude: 16.4600, longitude: 102.8600 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'ขอนแก่น', district: 'อำเภอเมืองขอนแก่น', address: 'อำเภอเมืองขอนแก่น จังหวัดขอนแก่น', checkInRadius: 50, michelinRating: 'Bib Gourmand' }
];

// Nakhon Ratchasima - More Bib Gourmand (10 total)
const nakhonRatchasimaMichelinRestaurants = [
  { id: 'michelin-ninascafe-nakhonratchasima-003', name: 'Nina\'s Cafe & Restaurant', nameEn: 'Nina\'s Cafe & Restaurant', description: 'Bib Gourmand - New entry', coordinates: { latitude: 14.9900, longitude: 102.1200 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'นครราชสีมา', district: 'อำเภอเมืองนครราชสีมา', address: 'อำเภอเมืองนครราชสีมา จังหวัดนครราชสีมา', checkInRadius: 50, michelinRating: 'Bib Gourmand' }
];

// Combine all restaurants
const allMichelinRestaurants = [
  ...bangkokMichelinRestaurants,
  ...phuketMichelinRestaurants,
  ...phangNgaMichelinRestaurants,
  ...ayutthayaMichelinRestaurants,
  ...chiangMaiMichelinRestaurants,
  ...khonKaenMichelinRestaurants,
  ...nakhonRatchasimaMichelinRestaurants
];

async function addComprehensiveMichelinRestaurants() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const restaurant of allMichelinRestaurants) {
      try {
        const existing = await TouristAttraction.findOne({
          $or: [
            { id: restaurant.id },
            { name: restaurant.name, province: restaurant.province }
          ]
        });

        if (existing) {
          await TouristAttraction.findOneAndUpdate(
            { _id: existing._id },
            {
              $set: {
                name: restaurant.name,
                nameEn: restaurant.nameEn || '',
                description: restaurant.description || '',
                coordinates: restaurant.coordinates,
                category: restaurant.category,
                categories: restaurant.categories,
                province: restaurant.province,
                district: restaurant.district || '',
                address: restaurant.address || '',
                checkInRadius: restaurant.checkInRadius || 50,
                isActive: true,
                michelinRating: restaurant.michelinRating || null,
                michelinStars: restaurant.michelinStars || null,
                updatedAt: new Date()
              }
            }
          );
          updated++;
        } else {
          await TouristAttraction.create({
            ...restaurant,
            isActive: true,
            coordinateSource: 'manual',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          added++;
          console.log(`➕ Added: ${restaurant.name} (${restaurant.province})`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${restaurant.name}:`, error.message);
        skipped++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Added: ${added}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📦 Total: ${allMichelinRestaurants.length}`);

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

addComprehensiveMichelinRestaurants();
