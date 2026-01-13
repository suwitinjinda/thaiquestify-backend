// data/tourist-attractions/nakhon-si-thammarat.js
const nakhonSiThammaratAttractions = [
  { id: 'nakhon-si-thammarat-001', name: 'วัดพระมหาธาตุวรมหาวิหาร', nameEn: 'Wat Phra Mahathat Woramahawihan', description: 'วัดสำคัญที่มีพระบรมธาตุ', coordinates: { latitude: 8.4167, longitude: 99.9667 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'นครศรีธรรมราช', district: 'อำเภอเมืองนครศรีธรรมราช', address: 'อำเภอเมืองนครศรีธรรมราช จังหวัดนครศรีธรรมราช', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => nakhonSiThammaratAttractions.filter(a => a.isActive);
const getAttractionById = (id) => nakhonSiThammaratAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => nakhonSiThammaratAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { nakhonSiThammaratAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
