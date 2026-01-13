// data/tourist-attractions/nakhon-pathom.js
const nakhonPathomAttractions = [
  { id: 'nakhon-pathom-001', name: 'วัดพระปฐมเจดีย์', nameEn: 'Phra Pathom Chedi', description: 'เจดีย์ที่ใหญ่ที่สุดในประเทศไทย เป็นสถานที่สำคัญทางประวัติศาสตร์', coordinates: { latitude: 13.8167, longitude: 100.0500 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'นครปฐม', district: 'อำเภอเมืองนครปฐม', address: 'อำเภอเมืองนครปฐม จังหวัดนครปฐม', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'nakhon-pathom-002', name: 'ตลาดดอนหวาย', nameEn: 'Don Wai Market', description: 'ตลาดริมน้ำที่จำหน่ายอาหารและสินค้าท้องถิ่น', coordinates: { latitude: 13.8000, longitude: 100.0333 }, category: 'market', categories: ['market', 'recommended'], province: 'นครปฐม', district: 'อำเภอเมืองนครปฐม', address: 'อำเภอเมืองนครปฐม จังหวัดนครปฐม', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => nakhonPathomAttractions.filter(a => a.isActive);
const getAttractionById = (id) => nakhonPathomAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => nakhonPathomAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { nakhonPathomAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
