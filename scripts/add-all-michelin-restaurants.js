// scripts/add-all-michelin-restaurants.js
// Script to add Michelin restaurants from all provinces to database

const mongoose = require('mongoose');
const TouristAttraction = require('../models/TouristAttraction');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

// Comprehensive list of Michelin restaurants across Thailand
const michelinRestaurants = [
  // Phuket - 1 Star restaurants
  {
    id: 'michelin-pru-phuket-001',
    name: 'PRU',
    nameEn: 'PRU',
    description: 'Farm-to-table restaurant at Trisara Resort emphasizing local sourcing and seasonal tasting menu',
    coordinates: { latitude: 7.9500, longitude: 98.3000 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'ภูเก็ต',
    district: 'อำเภอกะทู้',
    address: 'Trisara Resort อำเภอกะทู้ จังหวัดภูเก็ต',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-aulis-phuket-002',
    name: 'Aulis Phuket',
    nameEn: 'Aulis Phuket',
    description: 'Intimate 15-seat chef\'s table focusing on hyper-local ingredients, over 95% sourced from Thailand',
    coordinates: { latitude: 7.9000, longitude: 98.3500 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'ภูเก็ต',
    district: 'อำเภอกะทู้',
    address: 'Iniala Beach House อำเภอกะทู้ จังหวัดภูเก็ต',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  // Chiang Mai - Bib Gourmand (sample of most popular)
  {
    id: 'michelin-khaosoi-maemanee-chiangmai-001',
    name: 'ข้าวซอยแม่มณี',
    nameEn: 'Khao Soi Mae Manee',
    description: 'Well-known street food vendor serving Khao Soi for over 30 years',
    coordinates: { latitude: 18.7883, longitude: 98.9853 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอเมืองเชียงใหม่',
    address: 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-baanlandai-chiangmai-002',
    name: 'บ้านลานไท',
    nameEn: 'Baan Landai Fine Thai Cuisine',
    description: 'Innovative takes on Northern Thai classics with quality ingredients and refined presentation',
    coordinates: { latitude: 18.7900, longitude: 98.9900 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอเมืองเชียงใหม่',
    address: 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-gingerfarm-chiangmai-003',
    name: 'Ginger Farm Kitchen',
    nameEn: 'Ginger Farm Kitchen',
    description: 'Northern Thai food with farm-to-table concept, most produce from own farm',
    coordinates: { latitude: 18.7850, longitude: 98.9800 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอเมืองเชียงใหม่',
    address: 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  // Phang Nga - Bib Gourmand
  {
    id: 'michelin-takola-phangnga-001',
    name: 'Takola',
    nameEn: 'Takola',
    description: 'Bib Gourmand restaurant in Phang Nga',
    coordinates: { latitude: 8.4500, longitude: 98.5000 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'พังงา',
    district: 'อำเภอเมืองพังงา',
    address: 'อำเภอเมืองพังงา จังหวัดพังงา',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-samchong-phangnga-002',
    name: 'Sam Chong Seafood',
    nameEn: 'Sam Chong Seafood',
    description: 'Bib Gourmand seafood restaurant in Phang Nga',
    coordinates: { latitude: 8.4600, longitude: 98.5100 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'พังงา',
    district: 'อำเภอเมืองพังงา',
    address: 'อำเภอเมืองพังงา จังหวัดพังงา',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  // Khon Kaen - Bib Gourmand
  {
    id: 'michelin-mekinfarm-khonkaen-001',
    name: 'Mekin Farm',
    nameEn: 'Mekin Farm',
    description: 'Organic farm restaurant offering dishes with simple cooking techniques to highlight natural flavors',
    coordinates: { latitude: 16.4333, longitude: 102.8333 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'ขอนแก่น',
    district: 'อำเภอเมืองขอนแก่น',
    address: 'อำเภอเมืองขอนแก่น จังหวัดขอนแก่น',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  // Nakhon Ratchasima - Bib Gourmand
  {
    id: 'michelin-penlaos-nakhonratchasima-001',
    name: 'Penlaos',
    nameEn: 'Penlaos',
    description: 'Isan cuisine using homemade condiments, signature dishes include spicy catfish salad',
    coordinates: { latitude: 14.9700, longitude: 102.1000 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'นครราชสีมา',
    district: 'อำเภอเมืองนครราชสีมา',
    address: 'อำเภอเมืองนครราชสีมา จังหวัดนครราชสีมา',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-labsomphit-nakhonratchasima-002',
    name: 'Lab Somphit',
    nameEn: 'Lab Somphit',
    description: 'Street food establishment known for flavorful Isan dishes with intense local spices',
    coordinates: { latitude: 14.9800, longitude: 102.1100 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'นครราชสีมา',
    district: 'อำเภอเมืองนครราชสีมา',
    address: 'อำเภอเมืองนครราชสีมา จังหวัดนครราชสีมา',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  // Ubon Ratchathani - Bib Gourmand
  {
    id: 'michelin-paearaya-ubon-001',
    name: 'แป๊ะอารายา',
    nameEn: 'Pae Araya',
    description: 'Local dishes showcasing the region\'s culinary heritage',
    coordinates: { latitude: 15.2333, longitude: 104.8500 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'อุบลราชธานี',
    district: 'อำเภอเมืองอุบลราชธานี',
    address: 'อำเภอเมืองอุบลราชธานี จังหวัดอุบลราชธานี',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  // Udon Thani - Bib Gourmand
  {
    id: 'michelin-kruakhunnid-udon-001',
    name: 'ครัวคุณนิด',
    nameEn: 'Krua Khun Nid',
    description: 'Authentic local cuisine providing traditional Udon Thani flavors',
    coordinates: { latitude: 17.4167, longitude: 102.7833 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'อุดรธานี',
    district: 'อำเภอเมืองอุดรธานี',
    address: 'อำเภอเมืองอุดรธานี จังหวัดอุดรธานี',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  // Surat Thani (Ko Samui) - Bib Gourmand
  {
    id: 'michelin-baansuanlungkhai-samui-001',
    name: 'บ้านสวนลุงไข่',
    nameEn: 'Baan Suan Lung Khai',
    description: 'Local and Southern Thai cuisine using freshest daily ingredients on chef-owner\'s coconut plantation',
    coordinates: { latitude: 9.5000, longitude: 100.0000 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'สุราษฎร์ธานี',
    district: 'อำเภอเกาะสมุย',
    address: 'อำเภอเกาะสมุย จังหวัดสุราษฎร์ธานี',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-kapisator-samui-002',
    name: 'กะปิสะตอ',
    nameEn: 'Kapi Sator',
    description: 'Authentic Southern Thai dishes including local squid in sweet coconut milk soup',
    coordinates: { latitude: 9.5100, longitude: 100.0100 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'สุราษฎร์ธานี',
    district: 'อำเภอเกาะสมุย',
    address: 'อำเภอเกาะสมุย จังหวัดสุราษฎร์ธานี',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  // Surat Thani Mainland - Bib Gourmand
  {
    id: 'michelin-lucky-suratthani-001',
    name: 'Lucky Restaurant',
    nameEn: 'Lucky Restaurant',
    description: 'Family-run eatery serving Thai-Chinese, Southern Thai, and seafood cuisine',
    coordinates: { latitude: 9.1400, longitude: 99.3200 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'สุราษฎร์ธานี',
    district: 'อำเภอเมืองสุราษฎร์ธานี',
    address: 'อำเภอเมืองสุราษฎร์ธานี จังหวัดสุราษฎร์ธานี',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-yokkheng-suratthani-002',
    name: 'โยกเข่ง',
    nameEn: 'Yok Kheng',
    description: 'Specializes in regional specialties, particularly "Long Tong" - Surat Thani delicacy',
    coordinates: { latitude: 9.1500, longitude: 99.3300 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'สุราษฎร์ธานี',
    district: 'อำเภอเมืองสุราษฎร์ธานี',
    address: 'อำเภอเมืองสุราษฎร์ธานี จังหวัดสุราษฎร์ธานี',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-liantai-suratthani-003',
    name: 'เลี่ยนไท',
    nameEn: 'Lian Tai',
    description: 'Street food venue specializing in deep-fried doughnuts (Patongko) using family recipe over 50 years',
    coordinates: { latitude: 9.1600, longitude: 99.3400 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'สุราษฎร์ธานี',
    district: 'อำเภอเมืองสุราษฎร์ธานี',
    address: 'อำเภอเมืองสุราษฎร์ธานี จังหวัดสุราษฎร์ธานี',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  // Ayutthaya - Bib Gourmand
  {
    id: 'michelin-kruaaisawan-ayutthaya-001',
    name: 'ครัวอัยย์สวรรค์',
    nameEn: 'Krua Aisawan',
    description: 'Bib Gourmand restaurant in Ayutthaya',
    coordinates: { latitude: 14.3500, longitude: 100.5667 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'พระนครศรีอยุธยา',
    district: 'อำเภอพระนครศรีอยุธยา',
    address: 'อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-baanpukarn-ayutthaya-002',
    name: 'บ้านปู่กาน',
    nameEn: 'Baan Pu Karn',
    description: 'Bib Gourmand restaurant in Ayutthaya',
    coordinates: { latitude: 14.3600, longitude: 100.5700 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'พระนครศรีอยุธยา',
    district: 'อำเภอพระนครศรีอยุธยา',
    address: 'อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  // Phuket - More Bib Gourmand
  {
    id: 'michelin-kin-kub-ei-phuket-003',
    name: 'กินกุบเอ้',
    nameEn: 'Kin-Kub-Ei',
    description: 'Southern Thai specialties passed down through generations',
    coordinates: { latitude: 7.8800, longitude: 98.3000 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'ภูเก็ต',
    district: 'อำเภอเมืองภูเก็ต',
    address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-kruabaanplatong-phuket-004',
    name: 'ครัวบ้านปลาตอง',
    nameEn: 'Krua Baan Platong',
    description: 'Quality local ingredients producing intensely flavored Phuket dishes',
    coordinates: { latitude: 7.8900, longitude: 98.3100 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'ภูเก็ต',
    district: 'อำเภอเมืองภูเก็ต',
    address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-tukabkhao-phuket-005',
    name: 'ตู้กับข้าว',
    nameEn: 'Tu Kab Khao',
    description: 'Elegant restaurant in Sino-Portuguese building serving Southern Thai cuisine',
    coordinates: { latitude: 7.9000, longitude: 98.3200 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'ภูเก็ต',
    district: 'อำเภอเมืองภูเก็ต',
    address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-mookmanee-phuket-006',
    name: 'มุกมณี',
    nameEn: 'Mook Manee',
    description: 'Fresh seafood including steamed blue swimming crab and Phuket lobster',
    coordinates: { latitude: 7.9100, longitude: 98.3300 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'ภูเก็ต',
    district: 'อำเภอเมืองภูเก็ต',
    address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-gobenz-phuket-007',
    name: 'โกเบนซ์',
    nameEn: 'Go Benz',
    description: 'Flavorful rice porridge and noodle dishes with crispy pork belly',
    coordinates: { latitude: 7.9200, longitude: 98.3400 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'ภูเก็ต',
    district: 'อำเภอเมืองภูเก็ต',
    address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-onechun-phuket-008',
    name: 'วันจันทร์',
    nameEn: 'One Chun',
    description: 'Traditional Phuketian cuisine in vintage setting',
    coordinates: { latitude: 7.9300, longitude: 98.3500 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'ภูเก็ต',
    district: 'อำเภอเมืองภูเก็ต',
    address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-raya-phuket-009',
    name: 'รายา',
    nameEn: 'Raya',
    description: 'Authentic Southern Thai dishes in colonial-style building',
    coordinates: { latitude: 7.9400, longitude: 98.3600 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'ภูเก็ต',
    district: 'อำเภอเมืองภูเก็ต',
    address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  // Chiang Mai - More Bib Gourmand
  {
    id: 'michelin-ekachan-chiangmai-004',
    name: 'เอกชัน',
    nameEn: 'Ekachan',
    description: 'New Bib Gourmand addition recognized for quality cuisine',
    coordinates: { latitude: 18.7900, longitude: 98.9900 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอเมืองเชียงใหม่',
    address: 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-rasik-chiangmai-005',
    name: 'Rasik Local Kitchen',
    nameEn: 'Rasik Local Kitchen',
    description: 'New Bib Gourmand entrant offering notable dishes',
    coordinates: { latitude: 18.7950, longitude: 98.9950 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอเมืองเชียงใหม่',
    address: 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-sanae-chiangmai-006',
    name: 'Sanae Thai Cuisine',
    nameEn: 'Sanae Thai Cuisine',
    description: 'Halal kitchen beside Ping River, renowned for exceptional beef dishes',
    coordinates: { latitude: 18.8000, longitude: 99.0000 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอเมืองเชียงใหม่',
    address: 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-charoensuan-aek-chiangmai-007',
    name: 'เจริญสวนแอ๊ก',
    nameEn: 'Charoen Suan Aek',
    description: 'Authentic and boldly flavored Northern Thai dishes with indigenous ingredients',
    coordinates: { latitude: 18.8050, longitude: 99.0050 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอเมืองเชียงใหม่',
    address: 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-tuneingarden-chiangmai-008',
    name: 'Tune in Garden',
    nameEn: 'Tune in Garden',
    description: 'Fixed-price menu with roasted pork ribs and fermented pork dishes',
    coordinates: { latitude: 18.8100, longitude: 99.0100 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'เชียงใหม่',
    district: 'อำเภอเมืองเชียงใหม่',
    address: 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  // Khon Kaen - More Bib Gourmand
  {
    id: 'michelin-herejoi-khonkaen-002',
    name: 'Here Joi Beef Noodle',
    nameEn: 'Here Joi Beef Noodle',
    description: 'Bib Gourmand beef noodle restaurant',
    coordinates: { latitude: 16.4400, longitude: 102.8400 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'ขอนแก่น',
    district: 'อำเภอเมืองขอนแก่น',
    address: 'อำเภอเมืองขอนแก่น จังหวัดขอนแก่น',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-phothabo-khonkaen-003',
    name: 'Pho Tha Bo',
    nameEn: 'Pho Tha Bo',
    description: 'Bib Gourmand restaurant',
    coordinates: { latitude: 16.4500, longitude: 102.8500 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'ขอนแก่น',
    district: 'อำเภอเมืองขอนแก่น',
    address: 'อำเภอเมืองขอนแก่น จังหวัดขอนแก่น',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  // Udon Thani - More Bib Gourmand
  {
    id: 'michelin-kaopiaksen-udon-002',
    name: 'Kao.Piak.Sen',
    nameEn: 'Kao.Piak.Sen',
    description: 'Bib Gourmand restaurant',
    coordinates: { latitude: 17.4200, longitude: 102.7900 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'อุดรธานี',
    district: 'อำเภอเมืองอุดรธานี',
    address: 'อำเภอเมืองอุดรธานี จังหวัดอุดรธานี',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-samuay-udon-003',
    name: 'Samuay & Sons',
    nameEn: 'Samuay & Sons',
    description: 'Bib Gourmand restaurant',
    coordinates: { latitude: 17.4300, longitude: 102.8000 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'อุดรธานี',
    district: 'อำเภอเมืองอุดรธานี',
    address: 'อำเภอเมืองอุดรธานี จังหวัดอุดรธานี',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  // Surat Thani - More Bib Gourmand
  {
    id: 'michelin-junhom-samui-003',
    name: 'Jun Hom',
    nameEn: 'Jun Hom',
    description: 'Bib Gourmand restaurant on Ko Samui',
    coordinates: { latitude: 9.5200, longitude: 100.0200 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'สุราษฎร์ธานี',
    district: 'อำเภอเกาะสมุย',
    address: 'อำเภอเกาะสมุย จังหวัดสุราษฎร์ธานี',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-kruachaobaan-samui-004',
    name: 'ครัวเจ้าบ้านสมุย',
    nameEn: 'Krua Chao Baan Samui',
    description: 'Authentic local flavors and affordability on Ko Samui',
    coordinates: { latitude: 9.5300, longitude: 100.0300 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'สุราษฎร์ธานี',
    district: 'อำเภอเกาะสมุย',
    address: 'อำเภอเกาะสมุย จังหวัดสุราษฎร์ธานี',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-pating-suratthani-004',
    name: 'Pa Ting',
    nameEn: 'Pa Ting',
    description: 'Authentic local flavors and affordability',
    coordinates: { latitude: 9.1700, longitude: 99.3500 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'สุราษฎร์ธานี',
    district: 'อำเภอเมืองสุราษฎร์ธานี',
    address: 'อำเภอเมืองสุราษฎร์ธานี จังหวัดสุราษฎร์ธานี',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-phunisa-suratthani-005',
    name: 'Phunisa',
    nameEn: 'Phunisa',
    description: 'Variety of regional dishes at reasonable prices',
    coordinates: { latitude: 9.1800, longitude: 99.3600 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'สุราษฎร์ธานี',
    district: 'อำเภอเมืองสุราษฎร์ธานี',
    address: 'อำเภอเมืองสุราษฎร์ธานี จังหวัดสุราษฎร์ธานี',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-sumgradangnga-suratthani-006',
    name: 'Sum Gradang Nga',
    nameEn: 'Sum Gradang Nga',
    description: 'Traditional recipes and cost-effective menu',
    coordinates: { latitude: 9.1900, longitude: 99.3700 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'สุราษฎร์ธานี',
    district: 'อำเภอเมืองสุราษฎร์ธานี',
    address: 'อำเภอเมืองสุราษฎร์ธานี จังหวัดสุราษฎร์ธานี',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-keopla-suratthani-007',
    name: 'Keo Pla',
    nameEn: 'Keo Pla',
    description: 'Fresh seafood offerings and local specialties',
    coordinates: { latitude: 9.2000, longitude: 99.3800 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'สุราษฎร์ธานี',
    district: 'อำเภอเมืองสุราษฎร์ธานี',
    address: 'อำเภอเมืองสุราษฎร์ธานี จังหวัดสุราษฎร์ธานี',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-khaophraram-suratthani-008',
    name: 'Khao Phra Ram Long Song Lao Ohw',
    nameEn: 'Khao Phra Ram Long Song Lao Ohw',
    description: 'Quality cuisine and value for money',
    coordinates: { latitude: 9.2100, longitude: 99.3900 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'สุราษฎร์ธานี',
    district: 'อำเภอเมืองสุราษฎร์ธานี',
    address: 'อำเภอเมืองสุราษฎร์ธานี จังหวัดสุราษฎร์ธานี',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  // Phang Nga - More Bib Gourmand
  {
    id: 'michelin-gophochana-phangnga-003',
    name: 'Gop Phochana',
    nameEn: 'Gop Phochana',
    description: 'Bib Gourmand restaurant in Phang Nga',
    coordinates: { latitude: 8.4700, longitude: 98.5200 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'พังงา',
    district: 'อำเภอเมืองพังงา',
    address: 'อำเภอเมืองพังงา จังหวัดพังงา',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-tonfonbistro-phangnga-004',
    name: 'Tonfon Bistro',
    nameEn: 'Tonfon Bistro',
    description: 'Bib Gourmand restaurant in Phang Nga',
    coordinates: { latitude: 8.4800, longitude: 98.5300 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'พังงา',
    district: 'อำเภอเมืองพังงา',
    address: 'อำเภอเมืองพังงา จังหวัดพังงา',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-khokloibamitom-phangnga-005',
    name: 'Khok Kloi Bami Tom',
    nameEn: 'Khok Kloi Bami Tom',
    description: 'Bib Gourmand restaurant in Phang Nga',
    coordinates: { latitude: 8.4900, longitude: 98.5400 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'พังงา',
    district: 'อำเภอเมืองพังงา',
    address: 'อำเภอเมืองพังงา จังหวัดพังงา',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-roedang-phangnga-006',
    name: 'Roe Dang',
    nameEn: 'Roe Dang',
    description: 'Bib Gourmand restaurant in Phang Nga',
    coordinates: { latitude: 8.5000, longitude: 98.5500 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'พังงา',
    district: 'อำเภอเมืองพังงา',
    address: 'อำเภอเมืองพังงา จังหวัดพังงา',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  // Nakhon Pathom - Bib Gourmand
  {
    id: 'michelin-plaew-nakhonpathom-001',
    name: 'Plaew',
    nameEn: 'Plaew',
    description: 'Bib Gourmand restaurant in Nakhon Pathom',
    coordinates: { latitude: 13.8200, longitude: 100.0600 },
    category: 'michelin',
    categories: ['michelin', 'restaurant', 'recommended'],
    province: 'นครปฐม',
    district: 'อำเภอเมืองนครปฐม',
    address: 'อำเภอเมืองนครปฐม จังหวัดนครปฐม',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  }
];

async function addAllMichelinRestaurants() {
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

    for (const restaurant of michelinRestaurants) {
      try {
        // Check if restaurant already exists
        const existing = await TouristAttraction.findOne({
          $or: [
            { id: restaurant.id },
            { name: restaurant.name, province: restaurant.province }
          ]
        });

        if (existing) {
          // Update existing
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
          console.log(`🔄 Updated: ${restaurant.name} (${restaurant.province})`);
        } else {
          // Create new
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
    console.log(`   📦 Total: ${michelinRestaurants.length}`);

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

addAllMichelinRestaurants();
