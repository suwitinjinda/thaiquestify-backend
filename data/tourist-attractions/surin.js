// data/tourist-attractions/surin.js
const surinAttractions = [
  { id: 'surin-001', name: 'หมู่บ้านช้างบ้านตากลาง', nameEn: 'Ban Ta Klang Elephant Village', description: 'แหล่งท่องเที่ยวที่สามารถชมวิถีชีวิตของช้างและควาญช้าง', coordinates: { latitude: 14.7000, longitude: 103.4000 }, category: 'other', categories: ['other', 'recommended'], province: 'สุรินทร์', district: 'อำเภอท่าตูม', address: 'อำเภอท่าตูม จังหวัดสุรินทร์', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => surinAttractions.filter(a => a.isActive);
const getAttractionById = (id) => surinAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => surinAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { surinAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
