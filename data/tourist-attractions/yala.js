// data/tourist-attractions/yala.js
const yalaAttractions = [
  { id: 'yala-001', name: 'น้ำตกธารโต', nameEn: 'Than To Waterfall', description: 'น้ำตกที่สวยงาม', coordinates: { latitude: 6.5167, longitude: 101.2833 }, category: 'waterfall', categories: ['waterfall', 'park', 'recommended'], province: 'ยะลา', district: 'อำเภอเมืองยะลา', address: 'อำเภอเมืองยะลา จังหวัดยะลา', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => yalaAttractions.filter(a => a.isActive);
const getAttractionById = (id) => yalaAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => yalaAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { yalaAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
