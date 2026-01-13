// data/tourist-attractions/satun.js
const satunAttractions = [
  { id: 'satun-001', name: 'อุทยานแห่งชาติหมู่เกาะตะรุเตา', nameEn: 'Tarutao National Park', description: 'อุทยานแห่งชาติที่มีเกาะสวยงาม', coordinates: { latitude: 6.6167, longitude: 99.6333 }, category: 'park', categories: ['park', 'beach', 'recommended'], province: 'สตูล', district: 'อำเภอเมืองสตูล', address: 'อำเภอเมืองสตูล จังหวัดสตูล', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => satunAttractions.filter(a => a.isActive);
const getAttractionById = (id) => satunAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => satunAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { satunAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
