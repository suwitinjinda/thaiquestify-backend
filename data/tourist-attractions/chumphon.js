// data/tourist-attractions/chumphon.js
const chumphonAttractions = [
  { id: 'chumphon-001', name: 'เกาะเต่า', nameEn: 'Koh Tao', description: 'เกาะที่สวยงามและเป็นที่นิยมสำหรับการดำน้ำ', coordinates: { latitude: 10.0833, longitude: 99.8333 }, category: 'beach', categories: ['beach', 'recommended'], province: 'ชุมพร', district: 'อำเภอเมืองชุมพร', address: 'อำเภอเมืองชุมพร จังหวัดชุมพร', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => chumphonAttractions.filter(a => a.isActive);
const getAttractionById = (id) => chumphonAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => chumphonAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { chumphonAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
