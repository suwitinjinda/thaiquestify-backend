// data/tourist-attractions/nakhon-ratchasima.js
const nakhonRatchasimaAttractions = [
  { id: 'nakhon-ratchasima-001', name: 'ปราสาทหินพนมรุ้ง', nameEn: 'Phanom Rung Historical Park', description: 'ปราสาทหินขอมโบราณที่สวยงาม', coordinates: { latitude: 14.5333, longitude: 102.9333 }, category: 'historical', categories: ['historical', 'recommended'], province: 'นครราชสีมา', district: 'อำเภอปราสาท', address: 'อำเภอปราสาท จังหวัดนครราชสีมา', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'nakhon-ratchasima-002', name: 'เขาใหญ่', nameEn: 'Khao Yai', description: 'อุทยานแห่งชาติเขาใหญ่', coordinates: { latitude: 14.4000, longitude: 101.3000 }, category: 'park', categories: ['park', 'mountain', 'recommended'], province: 'นครราชสีมา', district: 'อำเภอปากช่อง', address: 'อำเภอปากช่อง จังหวัดนครราชสีมา', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => nakhonRatchasimaAttractions.filter(a => a.isActive);
const getAttractionById = (id) => nakhonRatchasimaAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => nakhonRatchasimaAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { nakhonRatchasimaAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
