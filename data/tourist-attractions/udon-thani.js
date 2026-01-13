// data/tourist-attractions/udon-thani.js
const udonThaniAttractions = [
  { id: 'udon-thani-001', name: 'วัดพระธาตุบังพวน', nameEn: 'Wat Phra That Bang Phuan', description: 'วัดสำคัญที่มีพระธาตุบังพวน', coordinates: { latitude: 17.4167, longitude: 102.7833 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'อุดรธานี', district: 'อำเภอเมืองอุดรธานี', address: 'อำเภอเมืองอุดรธานี จังหวัดอุดรธานี', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'udon-thani-002', name: 'พิพิธภัณฑ์บ้านเชียง', nameEn: 'Ban Chiang Museum', description: 'พิพิธภัณฑ์ที่แสดงโบราณคดีบ้านเชียง', coordinates: { latitude: 17.4000, longitude: 103.2333 }, category: 'museum', categories: ['museum', 'historical', 'recommended'], province: 'อุดรธานี', district: 'อำเภอหนองหาน', address: 'อำเภอหนองหาน จังหวัดอุดรธานี', checkInRadius: 100, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => udonThaniAttractions.filter(a => a.isActive);
const getAttractionById = (id) => udonThaniAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => udonThaniAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { udonThaniAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
