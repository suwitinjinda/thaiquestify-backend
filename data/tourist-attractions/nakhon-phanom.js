// data/tourist-attractions/nakhon-phanom.js
const nakhonPhanomAttractions = [
  { id: 'nakhon-phanom-001', name: 'พระธาตุพนม', nameEn: 'Phra That Phanom', description: 'พระธาตุศักดิ์สิทธิ์ที่เป็นศูนย์รวมจิตใจของชาวอีสาน', coordinates: { latitude: 16.9500, longitude: 104.7167 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'นครพนม', district: 'อำเภอธาตุพนม', address: 'อำเภอธาตุพนม จังหวัดนครพนม', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => nakhonPhanomAttractions.filter(a => a.isActive);
const getAttractionById = (id) => nakhonPhanomAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => nakhonPhanomAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { nakhonPhanomAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
