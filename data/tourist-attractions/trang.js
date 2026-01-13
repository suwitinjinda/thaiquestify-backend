// data/tourist-attractions/trang.js
const trangAttractions = [
  { id: 'trang-001', name: 'เกาะมุก', nameEn: 'Koh Mook', description: 'เกาะที่สวยงามและมีถ้ำมรกต', coordinates: { latitude: 7.3833, longitude: 99.3000 }, category: 'beach', categories: ['beach', 'recommended'], province: 'ตรัง', district: 'อำเภอกันตัง', address: 'อำเภอกันตัง จังหวัดตรัง', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => trangAttractions.filter(a => a.isActive);
const getAttractionById = (id) => trangAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => trangAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { trangAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
