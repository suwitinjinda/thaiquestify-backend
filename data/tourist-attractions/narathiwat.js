// data/tourist-attractions/narathiwat.js
const narathiwatAttractions = [
  { id: 'narathiwat-001', name: 'หาดปะนาเระ', nameEn: 'Panaere Beach', description: 'หาดทรายที่สวยงาม', coordinates: { latitude: 6.2500, longitude: 101.7167 }, category: 'beach', categories: ['beach', 'recommended'], province: 'นราธิวาส', district: 'อำเภอปะนาเระ', address: 'อำเภอปะนาเระ จังหวัดนราธิวาส', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => narathiwatAttractions.filter(a => a.isActive);
const getAttractionById = (id) => narathiwatAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => narathiwatAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { narathiwatAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
