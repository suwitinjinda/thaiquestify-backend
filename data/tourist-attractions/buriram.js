// data/tourist-attractions/buriram.js
const buriramAttractions = [
  { id: 'buriram-001', name: 'ปราสาทหินพนมรุ้ง', nameEn: 'Phanom Rung Historical Park', description: 'ปราสาทหินสมัยขอมที่ตั้งอยู่บนภูเขาไฟที่ดับแล้ว', coordinates: { latitude: 14.5333, longitude: 102.9333 }, category: 'historical', categories: ['historical', 'recommended'], province: 'บุรีรัมย์', district: 'อำเภอเฉลิมพระเกียรติ', address: 'อำเภอเฉลิมพระเกียรติ จังหวัดบุรีรัมย์', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => buriramAttractions.filter(a => a.isActive);
const getAttractionById = (id) => buriramAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => buriramAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { buriramAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
