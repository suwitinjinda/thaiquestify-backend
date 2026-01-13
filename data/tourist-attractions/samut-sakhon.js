// data/tourist-attractions/samut-sakhon.js
const samutSakhonAttractions = [
  { id: 'samut-sakhon-001', name: 'ตลาดน้ำท่าคา', nameEn: 'Tha Kha Floating Market', description: 'ตลาดน้ำที่ยังคงวิถีชีวิตดั้งเดิม', coordinates: { latitude: 13.5000, longitude: 100.0167 }, category: 'market', categories: ['market', 'recommended'], province: 'สมุทรสาคร', district: 'อำเภออัมพวา', address: 'อำเภออัมพวา จังหวัดสมุทรสาคร', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'samut-sakhon-002', name: 'วัดบางกุ้ง', nameEn: 'Wat Bang Kung', description: 'วัดที่มีต้นไม้ใหญ่ขึ้นปกคลุมโบสถ์', coordinates: { latitude: 13.4500, longitude: 100.0000 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'สมุทรสาคร', district: 'อำเภอบางคนที', address: 'อำเภอบางคนที จังหวัดสมุทรสาคร', checkInRadius: 100, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => samutSakhonAttractions.filter(a => a.isActive);
const getAttractionById = (id) => samutSakhonAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => samutSakhonAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { samutSakhonAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
