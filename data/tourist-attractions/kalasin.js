// data/tourist-attractions/kalasin.js
const kalasinAttractions = [
  { id: 'kalasin-001', name: 'สวนไดโนเสาร์', nameEn: 'Dinosaur Park', description: 'แหล่งท่องเที่ยวที่มีรูปปั้นไดโนเสาร์ขนาดใหญ่', coordinates: { latitude: 16.4333, longitude: 103.5000 }, category: 'other', categories: ['other', 'recommended'], province: 'กาฬสินธุ์', district: 'อำเภอเมืองกาฬสินธุ์', address: 'อำเภอเมืองกาฬสินธุ์ จังหวัดกาฬสินธุ์', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => kalasinAttractions.filter(a => a.isActive);
const getAttractionById = (id) => kalasinAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => kalasinAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { kalasinAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
