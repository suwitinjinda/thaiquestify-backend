// data/tourist-attractions/phatthalung.js
const phatthalungAttractions = [
  { id: 'phatthalung-001', name: 'เขาอกทะลุ', nameEn: 'Khao Ok Thalu', description: 'เขาที่มีรูทะลุเป็นเอกลักษณ์', coordinates: { latitude: 7.6167, longitude: 100.0833 }, category: 'other', categories: ['other', 'recommended'], province: 'พัทลุง', district: 'อำเภอเมืองพัทลุง', address: 'อำเภอเมืองพัทลุง จังหวัดพัทลุง', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => phatthalungAttractions.filter(a => a.isActive);
const getAttractionById = (id) => phatthalungAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => phatthalungAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { phatthalungAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
