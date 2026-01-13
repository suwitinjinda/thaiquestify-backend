// data/tourist-attractions/phang-nga.js
const phangNgaAttractions = [
  { id: 'phang-nga-001', name: 'อ่าวพังงา', nameEn: 'Phang Nga Bay', description: 'อ่าวที่มีเกาะหินปูนสวยงาม', coordinates: { latitude: 8.2500, longitude: 98.5000 }, category: 'other', categories: ['other', 'recommended'], province: 'พังงา', district: 'อำเภอเมืองพังงา', address: 'อำเภอเมืองพังงา จังหวัดพังงา', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'phang-nga-002', name: 'เกาะเจมส์บอนด์', nameEn: 'James Bond Island', description: 'เกาะที่มีชื่อเสียงจากภาพยนตร์เจมส์บอนด์', coordinates: { latitude: 8.2667, longitude: 98.5000 }, category: 'other', categories: ['other', 'recommended'], province: 'พังงา', district: 'อำเภอเมืองพังงา', address: 'อำเภอเมืองพังงา จังหวัดพังงา', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => phangNgaAttractions.filter(a => a.isActive);
const getAttractionById = (id) => phangNgaAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => phangNgaAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { phangNgaAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
