// data/tourist-attractions/mahasarakham.js
const mahasarakhamAttractions = [
  { id: 'mahasarakham-001', name: 'พระธาตุนาดูน', nameEn: 'Phra That Na Dun', description: 'พระธาตุที่สำคัญและเป็นศูนย์กลางของพุทธศาสนาในภาคอีสาน', coordinates: { latitude: 16.1833, longitude: 103.3000 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'มหาสารคาม', district: 'อำเภอนาดูน', address: 'อำเภอนาดูน จังหวัดมหาสารคาม', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => mahasarakhamAttractions.filter(a => a.isActive);
const getAttractionById = (id) => mahasarakhamAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => mahasarakhamAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { mahasarakhamAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
