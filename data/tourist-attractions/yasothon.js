// data/tourist-attractions/yasothon.js
const yasothonAttractions = [
  { id: 'yasothon-001', name: 'พญาคันคาก', nameEn: 'Phaya Khan Khak', description: 'รูปปั้นคางคกขนาดใหญ่ที่เป็นสัญลักษณ์ของจังหวัด', coordinates: { latitude: 15.8000, longitude: 104.1500 }, category: 'other', categories: ['other', 'recommended'], province: 'ยโสธร', district: 'อำเภอเมืองยโสธร', address: 'อำเภอเมืองยโสธร จังหวัดยโสธร', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => yasothonAttractions.filter(a => a.isActive);
const getAttractionById = (id) => yasothonAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => yasothonAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { yasothonAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
