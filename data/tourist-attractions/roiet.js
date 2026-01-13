// data/tourist-attractions/roiet.js
const roietAttractions = [
  { id: 'roiet-001', name: 'หอโหวด 101', nameEn: 'Ho Wat 101', description: 'หอชมเมืองที่มีความสูง 101 เมตร ตั้งอยู่ใจกลางเมืองร้อยเอ็ด', coordinates: { latitude: 16.0500, longitude: 103.6500 }, category: 'other', categories: ['other', 'recommended'], province: 'ร้อยเอ็ด', district: 'อำเภอเมืองร้อยเอ็ด', address: 'อำเภอเมืองร้อยเอ็ด จังหวัดร้อยเอ็ด', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => roietAttractions.filter(a => a.isActive);
const getAttractionById = (id) => roietAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => roietAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { roietAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
