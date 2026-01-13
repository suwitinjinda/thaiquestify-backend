// data/tourist-attractions/amnat-charoen.js
const amnatCharoenAttractions = [
  { id: 'amnat-charoen-001', name: 'พระมงคลมิ่งเมือง', nameEn: 'Phra Mongkhon Ming Mueang', description: 'พระพุทธรูปศักดิ์สิทธิ์ประจำจังหวัด', coordinates: { latitude: 15.8500, longitude: 104.6333 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'อำนาจเจริญ', district: 'อำเภอเมืองอำนาจเจริญ', address: 'อำเภอเมืองอำนาจเจริญ จังหวัดอำนาจเจริญ', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => amnatCharoenAttractions.filter(a => a.isActive);
const getAttractionById = (id) => amnatCharoenAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => amnatCharoenAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { amnatCharoenAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
