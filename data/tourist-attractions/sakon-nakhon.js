// data/tourist-attractions/sakon-nakhon.js
const sakonNakhonAttractions = [
  { id: 'sakon-nakhon-001', name: 'วัดพระธาตุเชิงชุมวรวิหาร', nameEn: 'Wat Phra That Choeng Chum', description: 'วัดสำคัญที่มีพระธาตุเชิงชุมเป็นศูนย์กลางความศรัทธา', coordinates: { latitude: 17.1500, longitude: 104.1500 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'สกลนคร', district: 'อำเภอเมืองสกลนคร', address: 'อำเภอเมืองสกลนคร จังหวัดสกลนคร', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => sakonNakhonAttractions.filter(a => a.isActive);
const getAttractionById = (id) => sakonNakhonAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => sakonNakhonAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { sakonNakhonAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
