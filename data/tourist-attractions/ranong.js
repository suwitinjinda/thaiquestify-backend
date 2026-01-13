// data/tourist-attractions/ranong.js
const ranongAttractions = [
  { id: 'ranong-001', name: 'บ่อน้ำพุร้อน', nameEn: 'Hot Springs', description: 'บ่อน้ำพุร้อนธรรมชาติ', coordinates: { latitude: 9.9667, longitude: 98.6333 }, category: 'other', categories: ['other', 'recommended'], province: 'ระนอง', district: 'อำเภอเมืองระนอง', address: 'อำเภอเมืองระนอง จังหวัดระนอง', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => ranongAttractions.filter(a => a.isActive);
const getAttractionById = (id) => ranongAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => ranongAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { ranongAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
