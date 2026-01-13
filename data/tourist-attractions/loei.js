// data/tourist-attractions/loei.js
const loeiAttractions = [
  { id: 'loei-001', name: 'ถนนคนเดินเชียงคาน', nameEn: 'Chiang Khan Walking Street', description: 'ถนนที่เต็มไปด้วยบ้านไม้เก่าและร้านค้าท้องถิ่น บรรยากาศย้อนยุค', coordinates: { latitude: 17.8833, longitude: 101.6667 }, category: 'other', categories: ['other', 'recommended'], province: 'เลย', district: 'อำเภอเชียงคาน', address: 'อำเภอเชียงคาน จังหวัดเลย', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => loeiAttractions.filter(a => a.isActive);
const getAttractionById = (id) => loeiAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => loeiAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { loeiAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
