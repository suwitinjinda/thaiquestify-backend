// data/tourist-attractions/nong-khai.js
const nongKhaiAttractions = [
  { id: 'nong-khai-001', name: 'สะพานมิตรภาพไทย-ลาว', nameEn: 'Thai-Lao Friendship Bridge', description: 'สะพานที่เชื่อมต่อประเทศไทยและลาว', coordinates: { latitude: 17.8833, longitude: 102.7167 }, category: 'other', categories: ['other', 'recommended'], province: 'หนองคาย', district: 'อำเภอเมืองหนองคาย', address: 'อำเภอเมืองหนองคาย จังหวัดหนองคาย', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => nongKhaiAttractions.filter(a => a.isActive);
const getAttractionById = (id) => nongKhaiAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => nongKhaiAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { nongKhaiAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
