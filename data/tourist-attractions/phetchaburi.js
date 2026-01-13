// data/tourist-attractions/phetchaburi.js
const phetchaburiAttractions = [
  { id: 'phetchaburi-001', name: 'พระนครคีรี (เขาวัง)', nameEn: 'Phra Nakhon Khiri (Khao Wang)', description: 'พระราชวังบนเขาที่สวยงาม สร้างขึ้นในสมัยรัชกาลที่ 4', coordinates: { latitude: 13.1167, longitude: 99.9500 }, category: 'historical', categories: ['historical', 'recommended'], province: 'เพชรบุรี', district: 'อำเภอเมืองเพชรบุรี', address: 'อำเภอเมืองเพชรบุรี จังหวัดเพชรบุรี', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'phetchaburi-002', name: 'ถ้ำเขาหลวง', nameEn: 'Khao Luang Cave', description: 'ถ้ำที่มีพระพุทธรูปและหินงอกหินย้อยสวยงาม', coordinates: { latitude: 13.1000, longitude: 99.9333 }, category: 'other', categories: ['other', 'recommended'], province: 'เพชรบุรี', district: 'อำเภอเมืองเพชรบุรี', address: 'อำเภอเมืองเพชรบุรี จังหวัดเพชรบุรี', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'phetchaburi-003', name: 'หาดชะอำ', nameEn: 'Cha-am Beach', description: 'หาดทรายที่สวยงามและเงียบสงบ', coordinates: { latitude: 12.8000, longitude: 99.9833 }, category: 'beach', categories: ['beach', 'recommended'], province: 'เพชรบุรี', district: 'อำเภอชะอำ', address: 'อำเภอชะอำ จังหวัดเพชรบุรี', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => phetchaburiAttractions.filter(a => a.isActive);
const getAttractionById = (id) => phetchaburiAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => phetchaburiAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { phetchaburiAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
