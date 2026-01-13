// data/tourist-attractions/chonburi.js
const chonburiAttractions = [
  { id: 'chonburi-001', name: 'พัทยา', nameEn: 'Pattaya', description: 'เมืองท่องเที่ยวชายทะเลที่มีชื่อเสียง มีหาดทรายสวยงามและกิจกรรมทางน้ำมากมาย', coordinates: { latitude: 12.9333, longitude: 100.8833 }, category: 'beach', categories: ['beach', 'recommended'], province: 'ชลบุรี', district: 'อำเภอบางละมุง', address: 'อำเภอบางละมุง จังหวัดชลบุรี', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'chonburi-002', name: 'เกาะล้าน', nameEn: 'Koh Larn', description: 'เกาะที่สวยงามใกล้พัทยา มีหาดทรายขาวและน้ำทะเลใส', coordinates: { latitude: 12.9167, longitude: 100.7833 }, category: 'beach', categories: ['beach', 'recommended'], province: 'ชลบุรี', district: 'อำเภอบางละมุง', address: 'อำเภอบางละมุง จังหวัดชลบุรี', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'chonburi-003', name: 'วัดพระใหญ่', nameEn: 'Big Buddha Temple', description: 'วัดที่มีพระพุทธรูปขนาดใหญ่', coordinates: { latitude: 12.9000, longitude: 100.9000 }, category: 'temple', categories: ['temple', 'recommended'], province: 'ชลบุรี', district: 'อำเภอบางละมุง', address: 'อำเภอบางละมุง จังหวัดชลบุรี', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => chonburiAttractions.filter(a => a.isActive);
const getAttractionById = (id) => chonburiAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => chonburiAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { chonburiAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
