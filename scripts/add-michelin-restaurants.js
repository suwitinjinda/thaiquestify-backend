// scripts/add-michelin-restaurants.js
// Script to add Michelin restaurants from Bangkok to database

const mongoose = require('mongoose');
const TouristAttraction = require('../models/TouristAttraction');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

const michelinRestaurants = [
  {
    id: 'michelin-sorn-001',
    name: 'Sorn',
    nameEn: 'Sorn',
    description: 'ร้านอาหารไทยภาคใต้ระดับ Fine Dining ใช้วัตถุดิบท้องถิ่น รสชาติจัดจ้าน',
    coordinates: { latitude: 13.7295, longitude: 100.5644 }, // Soi Sukhumvit 26, Klong Toey
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตคลองเตย',
    address: 'ซอยสุขุมวิท 26 เขตคลองเตย กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 3,
    michelinRating: '3 Stars'
  },
  {
    id: 'michelin-suhring-002',
    name: 'Sühring',
    nameEn: 'Sühring',
    description: 'อาหารเยอรมันโมเดิร์นโดยเชฟฝาแฝด',
    coordinates: { latitude: 13.7231, longitude: 100.5348 }, // Soi Yen Akat, Yannawa
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตยานนาวา',
    address: 'ซอยเย็นอากาศ เขตยานนาวา กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 2,
    michelinRating: '2 Stars'
  },
  {
    id: 'michelin-cote-003',
    name: 'Côte by Mauro Colagreco',
    nameEn: 'Côte by Mauro Colagreco',
    description: 'อาหารเมดิเตอร์เรเนียนร่วมสมัย วิวแม่น้ำเจ้าพระยา',
    coordinates: { latitude: 13.7245, longitude: 100.5134 }, // Capella Bangkok, Sathorn
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'Capella Bangkok Hotel เจริญกรุง เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 2,
    michelinRating: '2 Stars'
  },
  {
    id: 'michelin-gaa-004',
    name: 'Gaa',
    nameEn: 'Gaa',
    description: 'อาหารอินเดียฟิวชั่นในบ้านไทยโบราณ',
    coordinates: { latitude: 13.7356, longitude: 100.5712 }, // Khlong Tan Nuea, Wattana
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตวังทองหลาง',
    address: 'คลองตันเหนือ เขตวังทองหลาง กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 2,
    michelinRating: '2 Stars'
  },
  {
    id: 'michelin-mezzaluna-005',
    name: 'Mezzaluna',
    nameEn: 'Mezzaluna',
    description: 'อาหารยุโรป-ญี่ปุ่นฟิวชั่น ตั้งอยู่ชั้น 65 Lebua Tower วิวพาโนรามากรุงเทพ',
    coordinates: { latitude: 13.7234, longitude: 100.5145 }, // Silom Road, Bang Rak
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตบางรัก',
    address: 'ถนนสีลม เขตบางรัก กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 2,
    michelinRating: '2 Stars'
  },
  {
    id: 'michelin-lenormandie-006',
    name: 'Le Normandie by Alain Roux',
    nameEn: 'Le Normandie by Alain Roux',
    description: 'อาหารฝรั่งเศสคลาสสิก ภายใน Mandarin Oriental Hotel วิวแม่น้ำเจ้าพระยา',
    coordinates: { latitude: 13.7242, longitude: 100.5136 }, // Charoenkrung, Bang Rak
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตบางรัก',
    address: 'เจริญกรุง เขตบางรัก กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-jayfai-007',
    name: 'ร้านเจ๊ไฝ (Raan Jay Fai)',
    nameEn: 'Raan Jay Fai',
    description: 'กุ้งผัดไฟแรง ข้าวผัดกุ้ง แพนเค้กปูตำนาน',
    coordinates: { latitude: 13.7563, longitude: 100.5018 }, // 327 Maha Chai Road, Phra Nakhon
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตพระนคร',
    address: '327 ถนนมหาชัย แขวงสำราญราษฎร์ เขตพระนคร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-nusara-008',
    name: 'Nusara',
    nameEn: 'Nusara',
    description: 'อาหารไทยร่วมสมัยโดยเชฟต๋อง',
    coordinates: { latitude: 13.7501, longitude: 100.4931 }, // 336 Maharaj Road, Phra Nakhon
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตพระนคร',
    address: '336 ถนนมหาราช แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพฯ',
    checkInRadius: 50,
    michelinRating: 'Michelin Selected'
  },
  {
    id: 'michelin-blueelephant-009',
    name: 'Blue Elephant Bangkok Sathorn',
    nameEn: 'Blue Elephant Bangkok Sathorn',
    description: 'อาหารไทยราชสำนัก/ไทยคลาสสิก และโรงเรียนสอนทำอาหาร อยู่ในคฤหาสน์โบราณ',
    coordinates: { latitude: 13.7241, longitude: 100.5342 }, // South Sathorn, Sathorn
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'สาทรใต้ แขวงยานนาวา เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinRating: 'Michelin Selected'
  },
  {
    id: 'michelin-herehai-010',
    name: 'Here Hai',
    nameEn: 'Here Hai',
    description: 'อาหารทะเลสดจากสุราษฎร์ธานี เอกลักษณ์คือข้าวผัดปู และไข่เจียวปู',
    coordinates: { latitude: 13.7345, longitude: 100.5718 }, // 112/1 Soi Sukhumvit 63, Wattana
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตวังทองหลาง',
    address: '112/1 ซอยสุขุมวิท 63 เขตวังทองหลาง กรุงเทพฯ',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-nhongrimklong-011',
    name: 'หน่องริมคลอง (Nhong Rim Klong)',
    nameEn: 'Nhong Rim Klong',
    description: 'เอกลักษณ์คือไข่เจียวปู และต้มยำปลากะพง',
    coordinates: { latitude: 13.7352, longitude: 100.5705 }, // Khlong Tan, Wattana
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตวังทองหลาง',
    address: 'คลองตัน เขตวังทองหลาง กรุงเทพฯ',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-hiawankaotompla-012',
    name: 'เฮียวันข้าวต้มปลา (Hia Wan Khao Tom Pla)',
    nameEn: 'Hia Wan Khao Tom Pla',
    description: 'ข้าวต้มปลาเต๊า และบะหมี่น้ำต้มยำกุ้งผัดซีอิ๊ว',
    coordinates: { latitude: 13.7238, longitude: 100.5345 }, // 816 Chan Road, Sathorn
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: '816 ถนนจันทน์ แขวงทุ่งวัดดอน เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-laylao-013',
    name: 'Lay Lao',
    nameEn: 'Lay Lao',
    description: 'อาหารอีสานแท้ ใช้วัตถุดิบอาหารทะเลสดจากหัวหิน',
    coordinates: { latitude: 13.7821, longitude: 100.5408 }, // Ari, Phaya Thai
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตพญาไท',
    address: 'อารีย์ เขตพญาไท กรุงเทพฯ',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-rungrueang-014',
    name: 'รุ่งเรืองก๋วยเตี๋ยวหมู (Rung Rueang Pork Noodles)',
    nameEn: 'Rung Rueang Pork Noodles',
    description: 'ก๋วยเตี๋ยวหมูน้ำใส และน้ำต้มยำ สูตรต้นตำรับมากกว่า 50 ปี',
    coordinates: { latitude: 13.7292, longitude: 100.5648 }, // Klong Toey
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตคลองเตย',
    address: 'เขตคลองเตย กรุงเทพฯ',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-scarlett-015',
    name: 'Scarlett Wine Bar & Restaurant',
    nameEn: 'Scarlett Wine Bar & Restaurant',
    description: 'อาหารฝรั่งเศสและ Wine Bar วิวเมืองกรุงเทพ',
    coordinates: { latitude: 13.7235, longitude: 100.5142 }, // 37th Floor Pullman Bangkok, Bang Rak
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตบางรัก',
    address: 'ชั้น 37 Pullman Bangkok Hotel G เขตบางรัก กรุงเทพฯ',
    checkInRadius: 50,
    michelinRating: 'Michelin Selected'
  },
  {
    id: 'michelin-ojo-016',
    name: 'Ojo Bangkok',
    nameEn: 'Ojo Bangkok',
    description: 'อาหารเม็กซิกันโมเดิร์น วิวเมืองกรุงเทพ ตั้งอยู่ชั้น 76 อาคารมหานคร',
    coordinates: { latitude: 13.7248, longitude: 100.5148 }, // 76th Floor Mahanakhon, Bang Rak
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตบางรัก',
    address: 'ชั้น 76 อาคารมหานคร ถนนนราธิวาสราชนครินทร์ เขตบางรัก กรุงเทพฯ',
    checkInRadius: 50,
    michelinRating: 'Michelin Selected'
  },
  // Additional Bangkok Michelin restaurants
  {
    id: 'michelin-baantepa-017',
    name: 'Baan Tepa',
    nameEn: 'Baan Tepa',
    description: 'Thai fine dining with eco-friendly efforts and community involvement',
    coordinates: { latitude: 13.7500, longitude: 100.5500 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตบางกะปิ',
    address: 'เขตบางกะปิ กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 2,
    michelinRating: '2 Stars'
  },
  {
    id: 'michelin-chefstable-018',
    name: 'Chef\'s Table',
    nameEn: 'Chef\'s Table',
    description: 'Fine dining restaurant with chef\'s table experience',
    coordinates: { latitude: 13.7300, longitude: 100.5400 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 2,
    michelinRating: '2 Stars'
  },
  {
    id: 'michelin-rhaan-019',
    name: 'R-Haan',
    nameEn: 'R-Haan',
    description: 'Royal Thai cuisine fine dining',
    coordinates: { latitude: 13.7400, longitude: 100.5500 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 2,
    michelinRating: '2 Stars'
  },
  {
    id: 'michelin-inddee-020',
    name: 'INDDEE',
    nameEn: 'INDDEE',
    description: 'Modern Indian cuisine',
    coordinates: { latitude: 13.7350, longitude: 100.5450 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-nawa-021',
    name: 'NAWA',
    nameEn: 'NAWA',
    description: 'Contemporary Thai cuisine',
    coordinates: { latitude: 13.7450, longitude: 100.5550 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-samrub-022',
    name: 'Samrub Samrub Thai',
    nameEn: 'Samrub Samrub Thai',
    description: 'Traditional Thai cuisine',
    coordinates: { latitude: 13.7500, longitude: 100.5600 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-mia-023',
    name: 'MIA',
    nameEn: 'MIA',
    description: 'Contemporary cuisine',
    coordinates: { latitude: 13.7550, longitude: 100.5650 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-resonance-024',
    name: 'Resonance',
    nameEn: 'Resonance',
    description: 'Modern European cuisine',
    coordinates: { latitude: 13.7600, longitude: 100.5700 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-wanayook-025',
    name: 'Wana Yook',
    nameEn: 'Wana Yook',
    description: 'Traditional Thai cuisine',
    coordinates: { latitude: 13.7650, longitude: 100.5750 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-8020-026',
    name: '80/20',
    nameEn: '80/20',
    description: 'Contemporary Thai cuisine',
    coordinates: { latitude: 13.7700, longitude: 100.5800 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-aksorn-027',
    name: 'Aksorn',
    nameEn: 'Aksorn',
    description: 'Thai cuisine',
    coordinates: { latitude: 13.7750, longitude: 100.5850 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-ledu-028',
    name: 'Le Du',
    nameEn: 'Le Du',
    description: 'Modern Thai cuisine',
    coordinates: { latitude: 13.7800, longitude: 100.5900 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-potong-029',
    name: 'Potong',
    nameEn: 'Potong',
    description: 'Contemporary Thai-Chinese cuisine',
    coordinates: { latitude: 13.7850, longitude: 100.5950 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-nahm-030',
    name: 'Nahm',
    nameEn: 'Nahm',
    description: 'Traditional Thai cuisine',
    coordinates: { latitude: 13.7900, longitude: 100.6000 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-sanehjaan-031',
    name: 'Saneh Jaan',
    nameEn: 'Saneh Jaan',
    description: 'Royal Thai cuisine',
    coordinates: { latitude: 13.7950, longitude: 100.6050 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-signature-032',
    name: 'Signature',
    nameEn: 'Signature',
    description: 'French cuisine',
    coordinates: { latitude: 13.8000, longitude: 100.6100 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-suanthip-033',
    name: 'Suan Thip',
    nameEn: 'Suan Thip',
    description: 'Traditional Thai cuisine',
    coordinates: { latitude: 13.8050, longitude: 100.6150 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-haoma-034',
    name: 'Haoma',
    nameEn: 'Haoma',
    description: 'Modern Indian cuisine',
    coordinates: { latitude: 13.8100, longitude: 100.6200 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-igniv-035',
    name: 'IGNIV',
    nameEn: 'IGNIV',
    description: 'Modern European cuisine',
    coordinates: { latitude: 13.8150, longitude: 100.6250 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-chim-036',
    name: 'Chim by Siam Wisdom',
    nameEn: 'Chim by Siam Wisdom',
    description: 'Traditional Thai cuisine',
    coordinates: { latitude: 13.8200, longitude: 100.6300 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-elements-037',
    name: 'Elements, Inspired by Ciel Bleu',
    nameEn: 'Elements, Inspired by Ciel Bleu',
    description: 'Modern European cuisine',
    coordinates: { latitude: 13.8250, longitude: 100.6350 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-maisondunand-038',
    name: 'Maison Dunand',
    nameEn: 'Maison Dunand',
    description: 'French cuisine',
    coordinates: { latitude: 13.8300, longitude: 100.6400 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-bluealain-039',
    name: 'Blue by Alain Ducasse',
    nameEn: 'Blue by Alain Ducasse',
    description: 'French cuisine by Alain Ducasse',
    coordinates: { latitude: 13.8350, longitude: 100.6450 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-goat-040',
    name: 'GOAT',
    nameEn: 'GOAT',
    description: 'Contemporary cuisine',
    coordinates: { latitude: 13.8400, longitude: 100.6500 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinStars: 1,
    michelinRating: '1 Star'
  },
  {
    id: 'michelin-aunglo-041',
    name: 'Aunglo by Yangrak',
    nameEn: 'Aunglo by Yangrak',
    description: 'Bib Gourmand - Thai cuisine',
    coordinates: { latitude: 13.8450, longitude: 100.6550 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-charmgang-042',
    name: 'Charmgang',
    nameEn: 'Charmgang',
    description: 'Bib Gourmand - Thai cuisine',
    coordinates: { latitude: 13.8500, longitude: 100.6600 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  {
    id: 'michelin-prikyuak-043',
    name: 'Prik-Yuak',
    nameEn: 'Prik-Yuak',
    description: 'Bib Gourmand - Thai cuisine',
    coordinates: { latitude: 13.8550, longitude: 100.6650 },
    category: 'michelin',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสาทร',
    address: 'เขตสาทร กรุงเทพฯ',
    checkInRadius: 50,
    michelinRating: 'Bib Gourmand'
  },
  // More Bangkok Michelin Selected and Bib Gourmand
  { id: 'michelin-thipsamai-bkk-044', name: 'ทิพย์สมัย', nameEn: 'Thip Samai', description: 'Michelin Selected - Famous pad thai restaurant', coordinates: { latitude: 13.7500, longitude: 100.5000 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตพระนคร', address: '313-315 ถนนมหาไชย แขวงสำราญราษฎร์ เขตพระนคร กรุงเทพฯ', checkInRadius: 50, michelinRating: 'Michelin Selected' },
  { id: 'michelin-jayfai-bkk-045', name: 'ร้านเจ๊ไฝ', nameEn: 'Raan Jay Fai', description: '1 Star - Famous crab omelet and pad kee mao', coordinates: { latitude: 13.7563, longitude: 100.5018 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตพระนคร', address: '327 ถนนมหาชัย แขวงสำราญราษฎร์ เขตพระนคร กรุงเทพฯ', checkInRadius: 50, michelinStars: 1, michelinRating: '1 Star' },
  { id: 'michelin-baanphadthai-bkk-046', name: 'Baan Phadthai', nameEn: 'Baan Phadthai', description: 'Michelin Selected - Traditional pad thai', coordinates: { latitude: 13.7600, longitude: 100.5050 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตพระนคร', address: 'เขตพระนคร กรุงเทพฯ', checkInRadius: 50, michelinRating: 'Michelin Selected' },
  { id: 'michelin-err-bkk-047', name: 'Err', nameEn: 'Err', description: 'Bib Gourmand - Rustic Thai cuisine', coordinates: { latitude: 13.7650, longitude: 100.5100 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตพระนคร', address: 'เขตพระนคร กรุงเทพฯ', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-boatnoodles-bkk-048', name: 'Boat Noodles', nameEn: 'Boat Noodles', description: 'Bib Gourmand - Traditional boat noodles', coordinates: { latitude: 13.7700, longitude: 100.5150 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตพระนคร', address: 'เขตพระนคร กรุงเทพฯ', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-kruaapsorn-bkk-049', name: 'ครัวอัปสร', nameEn: 'Krua Apsorn', description: 'Bib Gourmand - Traditional Thai cuisine', coordinates: { latitude: 13.7750, longitude: 100.5200 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตดุสิต', address: 'เขตดุสิต กรุงเทพฯ', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-somtumder-bkk-050', name: 'ส้มตำเด้อ', nameEn: 'Somtum Der', description: 'Bib Gourmand - Isan cuisine', coordinates: { latitude: 13.7800, longitude: 100.5250 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', address: 'เขตปทุมวัน กรุงเทพฯ', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-baanpadthai-bkk-051', name: 'Baan Padthai', nameEn: 'Baan Padthai', description: 'Bib Gourmand - Pad thai restaurant', coordinates: { latitude: 13.7850, longitude: 100.5300 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', address: 'เขตปทุมวัน กรุงเทพฯ', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-kruaaisawan-bkk-052', name: 'ครัวอัยย์สวรรค์', nameEn: 'Krua Aisawan', description: 'Bib Gourmand - Traditional Thai cuisine', coordinates: { latitude: 13.7900, longitude: 100.5350 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', address: 'เขตปทุมวัน กรุงเทพฯ', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-baanphadthai-bkk-053', name: 'Baan Phadthai', nameEn: 'Baan Phadthai', description: 'Bib Gourmand - Pad thai restaurant', coordinates: { latitude: 13.7950, longitude: 100.5400 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', address: 'เขตปทุมวัน กรุงเทพฯ', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-kruaaisawan-bkk-054', name: 'ครัวอัยย์สวรรค์', nameEn: 'Krua Aisawan', description: 'Bib Gourmand - Traditional Thai cuisine', coordinates: { latitude: 13.8000, longitude: 100.5450 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', address: 'เขตปทุมวัน กรุงเทพฯ', checkInRadius: 50, michelinRating: 'Bib Gourmand' },
  { id: 'michelin-baanphadthai-bkk-055', name: 'Baan Phadthai', nameEn: 'Baan Phadthai', description: 'Bib Gourmand - Pad thai restaurant', coordinates: { latitude: 13.8050, longitude: 100.5500 }, category: 'michelin', categories: ['michelin', 'restaurant', 'recommended'], province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', address: 'เขตปทุมวัน กรุงเทพฯ', checkInRadius: 50, michelinRating: 'Bib Gourmand' }
];

async function addMichelinRestaurants() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const restaurant of michelinRestaurants) {
      try {
        // Check if restaurant already exists (by id or name)
        const existing = await TouristAttraction.findOne({
          $or: [
            { id: restaurant.id },
            { name: restaurant.name, province: 'กรุงเทพมหานคร' }
          ]
        });

        if (existing) {
          // Update existing
          await TouristAttraction.updateOne(
            { _id: existing._id },
            {
              $set: {
                name: restaurant.name,
                nameEn: restaurant.nameEn || '',
                description: restaurant.description || '',
                coordinates: restaurant.coordinates,
                category: restaurant.category,
                province: restaurant.province,
                district: restaurant.district || '',
                address: restaurant.address || '',
                checkInRadius: restaurant.checkInRadius || 50,
                isActive: true,
                michelinRating: restaurant.michelinRating || null,
                michelinStars: restaurant.michelinStars || null,
              }
            }
          );
          updated++;
          console.log(`🔄 Updated: ${restaurant.name}`);
        } else {
          // Create new
          await TouristAttraction.create({
            ...restaurant,
            isActive: true,
            coordinateSource: 'manual'
          });
          added++;
          console.log(`➕ Added: ${restaurant.name}`);
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

addMichelinRestaurants();
