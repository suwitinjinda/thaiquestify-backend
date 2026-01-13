// data/tourist-attractions/chaiyaphum.js
const chaiyaphumAttractions = [
  { id: 'chaiyaphum-001', name: 'ทุ่งดอกกระเจียว', nameEn: 'Krachiao Flower Field', description: 'แหล่งท่องเที่ยวที่มีดอกกระเจียวบานในช่วงฤดูฝน', coordinates: { latitude: 15.8000, longitude: 101.8333 }, category: 'other', categories: ['other', 'recommended'], province: 'ชัยภูมิ', district: 'อำเภอเทพสถิต', address: 'อำเภอเทพสถิต จังหวัดชัยภูมิ', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => chaiyaphumAttractions.filter(a => a.isActive);
const getAttractionById = (id) => chaiyaphumAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => chaiyaphumAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { chaiyaphumAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
