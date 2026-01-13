// data/tourist-attractions/si-sa-ket.js
const siSaKetAttractions = [
  { id: 'si-sa-ket-001', name: 'ปราสาทสระกำแพงใหญ่', nameEn: 'Prasat Sa Kamphaeng Yai', description: 'ปราสาทหินสมัยขอมที่มีความงดงาม', coordinates: { latitude: 15.1167, longitude: 104.3333 }, category: 'historical', categories: ['historical', 'recommended'], province: 'ศรีสะเกษ', district: 'อำเภออุทุมพรพิสัย', address: 'อำเภออุทุมพรพิสัย จังหวัดศรีสะเกษ', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => siSaKetAttractions.filter(a => a.isActive);
const getAttractionById = (id) => siSaKetAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => siSaKetAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { siSaKetAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
