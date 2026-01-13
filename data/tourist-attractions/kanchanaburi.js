// data/tourist-attractions/kanchanaburi.js
const kanchanaburiAttractions = [
  { id: 'kanchanaburi-001', name: 'สะพานข้ามแม่น้ำแคว', nameEn: 'Bridge over the River Kwai', description: 'สะพานประวัติศาสตร์ที่มีชื่อเสียงระดับโลก สร้างขึ้นในสมัยสงครามโลกครั้งที่ 2', coordinates: { latitude: 14.0333, longitude: 99.5167 }, category: 'historical', categories: ['historical', 'recommended'], province: 'กาญจนบุรี', district: 'อำเภอเมืองกาญจนบุรี', address: 'อำเภอเมืองกาญจนบุรี จังหวัดกาญจนบุรี', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'kanchanaburi-002', name: 'น้ำตกเอราวัณ', nameEn: 'Erawan Waterfall', description: 'น้ำตก 7 ชั้นที่สวยงามและเป็นที่นิยมมาก', coordinates: { latitude: 14.3667, longitude: 99.1500 }, category: 'waterfall', categories: ['waterfall', 'park', 'recommended'], province: 'กาญจนบุรี', district: 'อำเภอศรีสวัสดิ์', address: 'อำเภอศรีสวัสดิ์ จังหวัดกาญจนบุรี', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'kanchanaburi-003', name: 'สุสานทหารพันธมิตร', nameEn: 'Allied War Cemetery', description: 'สุสานทหารพันธมิตรที่เสียชีวิตในสงครามโลกครั้งที่ 2', coordinates: { latitude: 14.0300, longitude: 99.5200 }, category: 'historical', categories: ['historical', 'recommended'], province: 'กาญจนบุรี', district: 'อำเภอเมืองกาญจนบุรี', address: 'อำเภอเมืองกาญจนบุรี จังหวัดกาญจนบุรี', checkInRadius: 100, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => kanchanaburiAttractions.filter(a => a.isActive);
const getAttractionById = (id) => kanchanaburiAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => kanchanaburiAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { kanchanaburiAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
